import { Fyo, t } from 'fyo';
import { Converter } from 'fyo/core/converter';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { isNameAutoSet } from 'fyo/model/naming';
import { Noun, Verb } from 'fyo/telemetry/types';
import { ModelNameEnum } from 'models/types';
import {
  Field,
  FieldType,
  FieldTypeEnum,
  OptionField,
  SelectOption,
  TargetField,
} from 'schemas/types';
import {
  getDefaultMapFromList,
  getMapFromList,
  getValueMapFromList,
} from 'utils';
import { generateCSV, parseCSV } from '../utils/csvParser';

type Status = {
  success: boolean;
  message: string;
  names: string[];
};

type Exclusion = Record<string, string[]>;

type LoadingStatusCallback = (
  isMakingEntries: boolean,
  entriesMade: number,
  totalEntries: number
) => void;

interface TemplateField {
  label: string;
  fieldname: string;
  required: boolean;
  schemaName: string;
  options?: SelectOption[];
  fieldtype: FieldType;
  parentField: string;
}

const exclusion: Exclusion = {
  Item: ['image'],
  Party: ['address', 'outstandingAmount', 'image'],
};

function getFilteredDocFields(
  df: string | string[],
  fyo: Fyo
): [TemplateField[], string[][]] {
  let schemaName = df[0];
  let parentField = df[1] ?? '';

  if (typeof df === 'string') {
    schemaName = df;
    parentField = '';
  }

  const primaryFields: Field[] = fyo.schemaMap[schemaName]!.fields;
  const fields: TemplateField[] = [];
  const tableTypes: string[][] = [];
  const exclusionFields: string[] = exclusion[schemaName] ?? [];

  for (const field of primaryFields) {
    const { label, fieldtype, fieldname, required } = field;

    if (shouldSkip(field, exclusionFields, parentField)) {
      continue;
    }

    if (fieldtype === FieldTypeEnum.Table) {
      const { target } = field as TargetField;
      tableTypes.push([target, fieldname]);
      continue;
    }

    const options: SelectOption[] = (field as OptionField).options ?? [];

    fields.push({
      label,
      fieldname,
      schemaName,
      options,
      fieldtype,
      parentField,
      required: required ?? false,
    });
  }

  return [fields, tableTypes];
}

function shouldSkip(
  field: Field,
  exclusionFields: string[],
  parentField: string
): boolean {
  if (field.meta) {
    return true;
  }

  if (field.fieldname === 'name' && parentField) {
    return true;
  }

  if (field.required) {
    return false;
  }

  if (exclusionFields.includes(field.fieldname)) {
    return true;
  }

  if (field.hidden || field.readOnly) {
    return true;
  }

  return false;
}

function getTemplateFields(schemaName: string, fyo: Fyo): TemplateField[] {
  const fields: TemplateField[] = [];
  if (!schemaName) {
    return [];
  }

  const schemaNames: string[][] = [[schemaName]];
  while (schemaNames.length > 0) {
    const sn = schemaNames.pop();
    if (!sn) {
      break;
    }

    const [templateFields, tableTypes] = getFilteredDocFields(sn, fyo);
    fields.push(...templateFields);
    schemaNames.push(...tableTypes);
  }
  return fields;
}

export class Importer {
  schemaName: string;
  templateFields: TemplateField[];
  labelTemplateFieldMap: Record<string, TemplateField> = {};
  template: string;
  indices: number[] = [];
  parsedLabels: string[] = [];
  parsedValues: string[][] = [];
  assignedMap: Record<string, string> = {}; // target: import
  requiredMap: Record<string, boolean> = {};
  shouldSubmit: boolean = false;
  labelIndex: number = -1;
  csv: string[][] = [];
  fyo: Fyo;

  constructor(schemaName: string, fyo: Fyo) {
    this.schemaName = schemaName;
    this.fyo = fyo;
    this.templateFields = getTemplateFields(schemaName, this.fyo);
    this.template = generateCSV([this.templateFields.map((t) => t.label)]);
    this.labelTemplateFieldMap = getMapFromList(this.templateFields, 'label');
    this.assignedMap = getDefaultMapFromList(this.templateFields, '', 'label');
    this.requiredMap = getValueMapFromList(
      this.templateFields,
      'label',
      'required'
    ) as Record<string, boolean>;
  }

  get assignableLabels() {
    const req: string[] = [];
    const nreq: string[] = [];

    for (const label in this.labelTemplateFieldMap) {
      if (this.requiredMap[label]) {
        req.push(label);
        continue;
      }

      nreq.push(label);
    }

    return [req, nreq].flat();
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

  initialize(labelIndex: number, force: boolean = false) {
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

  getDocs(): DocValueMap[] {
    const fields = this.columnLabels.map((k) => this.labelTemplateFieldMap[k]);
    const nameIndex = fields.findIndex(({ fieldname }) => fieldname === 'name');

    const docMap: Record<string, DocValueMap> = {};

    const assignedMatrix = this.assignedMatrix;
    for (let r = 0; r < assignedMatrix.length; r++) {
      const row = assignedMatrix[r];
      const cts: Record<string, DocValueMap> = {};
      const name = row[nameIndex];

      docMap[name] ??= {};

      for (let f = 0; f < fields.length; f++) {
        const field = fields[f];
        const value = Converter.toDocValue(row[f], field, this.fyo);

        if (field.parentField) {
          cts[field.parentField] ??= {};
          cts[field.parentField][field.fieldname] = value;
          continue;
        }

        docMap[name][field.fieldname] = value;
      }

      for (const k of Object.keys(cts)) {
        docMap[name][k] ??= [];
        (docMap[name][k] as DocValueMap[]).push(cts[k]);
      }
    }

    return Object.keys(docMap).map((k) => docMap[k]);
  }

  async importData(setLoadingStatus: LoadingStatusCallback): Promise<Status> {
    const status: Status = { success: false, names: [], message: '' };
    const shouldDeleteName = isNameAutoSet(this.schemaName, this.fyo);
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

      const doc: Doc = this.fyo.doc.getNewDoc(this.schemaName, {}, false);
      try {
        await this.makeEntry(doc, docObj);
        entriesMade += 1;
        setLoadingStatus(true, entriesMade, docObjs.length);
      } catch (err) {
        setLoadingStatus(false, entriesMade, docObjs.length);

        this.fyo.telemetry.log(Verb.Imported, this.schemaName as Noun, {
          success: false,
          count: entriesMade,
        });

        return this.handleError(doc, err as Error, status);
      }

      status.names.push(doc.name!);
    }

    setLoadingStatus(false, entriesMade, docObjs.length);
    status.success = true;

    this.fyo.telemetry.log(Verb.Imported, this.schemaName as Noun, {
      success: true,
      count: entriesMade,
    });
    return status;
  }

  addRow() {
    const emptyRow = Array(this.columnLabels.length).fill('');
    this.parsedValues.push(emptyRow);
  }

  async makeEntry(doc: Doc, docObj: DocValueMap) {
    await doc.setAndSync(docObj);
    if (this.shouldSubmit) {
      await doc.submit();
    }
  }

  handleError(doc: Doc, err: Error, status: Status): Status {
    const messages = [t`Could not import ${this.schemaName} ${doc.name!}.`];

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
