import { t } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import Doc from 'fyo/model/doc';
import { isNameAutoSet } from 'fyo/model/naming';
import { Noun, Verb } from 'fyo/telemetry/types';
import { FieldType, FieldTypeEnum } from 'schemas/types';
import { parseCSV } from '../utils/csvParser';
import { fyo } from './initFyo';

export const importable = [
  'SalesInvoice',
  'PurchaseInvoice',
  'Payment',
  'JournalEntry',
  'Customer',
  'Supplier',
  'Item',
];

type Status = {
  success: boolean;
  message: string;
  names: string[];
};

type Exclusion = {
  [key: string]: string[];
};

type Map = Record<string, unknown>;
type ObjectMap = Record<string, Map>;

type LabelTemplateFieldMap = {
  [key: string]: TemplateField;
};

type LoadingStatusCallback = (
  isMakingEntries: boolean,
  entriesMade: number,
  totalEntries: number
) => void;

interface TemplateField {
  label: string;
  fieldname: string;
  required: boolean;
  doctype: string;
  options?: string[];
  fieldtype: FieldType;
  parentField: string;
}

function formatValue(value: string, fieldtype: FieldType): unknown {
  switch (fieldtype) {
    case FieldTypeEnum.Date:
      if (value === '') {
        return '';
      }
      return new Date(value);
    case FieldTypeEnum.Currency:
      // @ts-ignore
      return frappe.pesa(value || 0);
    case FieldTypeEnum.Int:
    case FieldTypeEnum.Float: {
      const n = parseFloat(value);
      if (!Number.isNaN(n)) {
        return n;
      }
      return 0;
    }
    default:
      return value;
  }
}

const exclusion: Exclusion = {
  Item: ['image'],
  Supplier: ['address', 'outstandingAmount', 'supplier', 'image', 'customer'],
  Customer: ['address', 'outstandingAmount', 'supplier', 'image', 'customer'],
};

function getFilteredDocFields(
  df: string | string[]
): [TemplateField[], string[][]] {
  let doctype = df[0];
  let parentField = df[1] ?? '';

  if (typeof df === 'string') {
    doctype = df;
    parentField = '';
  }

  // @ts-ignore
  const primaryFields: Field[] = frappe.models[doctype].fields;
  const fields: TemplateField[] = [];
  const tableTypes: string[][] = [];
  const exclusionFields: string[] = exclusion[doctype] ?? [];

  primaryFields.forEach(
    ({
      label,
      fieldtype,
      childtype,
      fieldname,
      readOnly,
      required,
      hidden,
      options,
    }) => {
      if (
        !(fieldname === 'name' && !parentField) &&
        (readOnly ||
          (hidden && typeof hidden === 'number') ||
          exclusionFields.includes(fieldname))
      ) {
        return;
      }

      if (fieldtype === FieldTypeEnum.Table && childtype) {
        tableTypes.push([childtype, fieldname]);
        return;
      }

      fields.push({
        label,
        fieldname,
        doctype,
        options,
        fieldtype,
        parentField,
        required: Boolean(required ?? false),
      });
    }
  );

  return [fields, tableTypes];
}

function getTemplateFields(doctype: string): TemplateField[] {
  const fields: TemplateField[] = [];
  if (!doctype) {
    return [];
  }
  const doctypes: string[][] = [[doctype]];
  while (doctypes.length > 0) {
    const dt = doctypes.pop();
    if (!dt) {
      break;
    }

    const [templateFields, tableTypes] = getFilteredDocFields(dt);
    fields.push(...templateFields);
    doctypes.push(...tableTypes);
  }
  return fields;
}

function getLabelFieldMap(templateFields: TemplateField[]): Map {
  const map: Map = {};

  templateFields.reduce((acc, tf) => {
    const key = tf.label as string;
    acc[key] = tf.fieldname;
    return acc;
  }, map);

  return map;
}

function getTemplate(templateFields: TemplateField[]): string {
  const labels = templateFields.map(({ label }) => `"${label}"`).join(',');
  return [labels, ''].join('\n');
}

export class Importer {
  doctype: string;
  templateFields: TemplateField[];
  map: Map;
  template: string;
  indices: number[] = [];
  parsedLabels: string[] = [];
  parsedValues: string[][] = [];
  assignedMap: Map = {}; // target: import
  requiredMap: Map = {};
  labelTemplateFieldMap: LabelTemplateFieldMap = {};
  shouldSubmit: boolean = false;
  labelIndex: number = -1;
  csv: string[][] = [];

  constructor(doctype: string) {
    this.doctype = doctype;
    this.templateFields = getTemplateFields(doctype);
    this.map = getLabelFieldMap(this.templateFields);
    this.template = getTemplate(this.templateFields);
    this.assignedMap = this.assignableLabels.reduce((acc: Map, k) => {
      acc[k] = '';
      return acc;
    }, {});
    this.requiredMap = this.templateFields.reduce((acc: Map, k) => {
      acc[k.label] = k.required;
      return acc;
    }, {});
    this.labelTemplateFieldMap = this.templateFields.reduce(
      (acc: LabelTemplateFieldMap, k) => {
        acc[k.label] = k;
        return acc;
      },
      {}
    );
  }

  get assignableLabels() {
    const req: string[] = [];
    const nreq: string[] = [];
    Object.keys(this.map).forEach((k) => {
      if (this.requiredMap[k]) {
        req.push(k);
        return;
      }

      nreq.push(k);
    });

    return [...req, ...nreq];
  }

  get unassignedLabels() {
    const assigned = Object.keys(this.assignedMap).map(
      (k) => this.assignedMap[k]
    );
    return this.parsedLabels.filter((l) => !assigned.includes(l));
  }

  get columnLabels() {
    const req: string[] = [];
    const nreq: string[] = [];

    this.assignableLabels.forEach((k) => {
      if (!this.assignedMap[k]) {
        return;
      }

      if (this.requiredMap[k]) {
        req.push(k);
        return;
      }

      nreq.push(k);
    });

    return [...req, ...nreq];
  }

  get assignedMatrix() {
    this.indices = this.columnLabels
      .map((k) => this.assignedMap[k])
      .filter(Boolean)
      .map((k) => this.parsedLabels.indexOf(k as string));

    const rows = this.parsedValues.length;
    const cols = this.columnLabels.length;

    const matrix = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const ix = this.indices[j];
        const value = this.parsedValues[i][ix] ?? '';
        row.push(value);
      }
      matrix.push(row);
    }

    return matrix;
  }

  dropRow(i: number) {
    this.parsedValues = this.parsedValues.filter((_, ix) => i !== ix);
  }

  updateValue(value: string, i: number, j: number) {
    this.parsedValues[i][this.indices[j]] = value ?? '';
  }

  selectFile(text: string): boolean {
    this.csv = parseCSV(text);
    try {
      this.initialize(0, true);
    } catch (err) {
      return false;
    }
    return true;
  }

  initialize(labelIndex: number, force: boolean) {
    if (
      (typeof labelIndex !== 'number' && !labelIndex) ||
      (labelIndex === this.labelIndex && !force)
    ) {
      return;
    }

    const source = this.csv.map((row) => [...row]);
    this.labelIndex = labelIndex;
    this.parsedLabels = source[labelIndex];
    this.parsedValues = source.slice(labelIndex + 1);
    this.setAssigned();
  }

  setAssigned() {
    const labels = [...this.parsedLabels];

    for (const k of Object.keys(this.assignedMap)) {
      const l = this.assignedMap[k] as string;
      if (!labels.includes(l)) {
        this.assignedMap[k] = '';
      }
    }

    labels.forEach((l) => {
      if (this.assignedMap[l] !== '') {
        return;
      }

      this.assignedMap[l] = l;
    });
  }

  getDocs(): Map[] {
    const fields = this.columnLabels.map((k) => this.labelTemplateFieldMap[k]);
    const nameIndex = fields.findIndex(({ fieldname }) => fieldname === 'name');

    const docMap: ObjectMap = {};

    const assignedMatrix = this.assignedMatrix;
    for (let r = 0; r < assignedMatrix.length; r++) {
      const row = assignedMatrix[r];
      const cts: ObjectMap = {};
      const name = row[nameIndex];

      docMap[name] ??= {};

      for (let f = 0; f < fields.length; f++) {
        const field = fields[f];
        const value = formatValue(row[f], field.fieldtype);

        if (field.parentField) {
          cts[field.parentField] ??= {};
          cts[field.parentField][field.fieldname] = value;
          continue;
        }

        docMap[name][field.fieldname] = value;
      }

      for (const k of Object.keys(cts)) {
        docMap[name][k] ??= [];
        (docMap[name][k] as Map[]).push(cts[k]);
      }
    }

    return Object.keys(docMap).map((k) => docMap[k]);
  }

  async importData(setLoadingStatus: LoadingStatusCallback): Promise<Status> {
    const status: Status = { success: false, names: [], message: '' };
    const shouldDeleteName = isNameAutoSet(this.doctype, fyo);
    const docObjs = this.getDocs();

    let entriesMade = 0;
    setLoadingStatus(true, 0, docObjs.length);

    for (const docObj of docObjs) {
      if (shouldDeleteName) {
        delete docObj.name;
      }

      for (const key in docObj) {
        if (docObj[key] !== '') {
          continue;
        }

        delete docObj[key];
      }

      const doc: Doc = fyo.doc.getEmptyDoc(this.doctype, false);
      try {
        await this.makeEntry(doc, docObj);
        entriesMade += 1;
        setLoadingStatus(true, entriesMade, docObjs.length);
      } catch (err) {
        setLoadingStatus(false, entriesMade, docObjs.length);

        fyo.telemetry.log(Verb.Imported, this.doctype as Noun, {
          success: false,
          count: entriesMade,
        });

        return this.handleError(doc, err as Error, status);
      }

      status.names.push(doc.name!);
    }

    setLoadingStatus(false, entriesMade, docObjs.length);
    status.success = true;

    fyo.telemetry.log(Verb.Imported, this.doctype as Noun, {
      success: true,
      count: entriesMade,
    });
    return status;
  }

  addRow() {
    const emptyRow = Array(this.columnLabels.length).fill('');
    this.parsedValues.push(emptyRow);
  }

  async makeEntry(doc: Doc, docObj: Map) {
    await doc.setMultiple(docObj as DocValueMap);
    await doc.insert();
    if (this.shouldSubmit) {
      await doc.submit();
    }
  }

  handleError(doc: Doc, err: Error, status: Status): Status {
    const messages = [t`Could not import ${this.doctype} ${doc.name!}.`];

    const message = err.message;
    if (message?.includes('UNIQUE constraint failed')) {
      messages.push(t`${doc.name!} already exists.`);
    } else if (message) {
      messages.push(message);
    }

    if (status.names.length) {
      messages.push(
        t`The following ${
          status.names.length
        } entries were created: ${status.names.join(', ')}`
      );
    }

    status.message = messages.join(' ');
    return status;
  }
}
