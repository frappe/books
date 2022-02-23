import { Field, FieldType } from '@/types/model';
import frappe from 'frappe';
import { parseCSV } from './csvParser';

export const importable = [
  'SalesInvoice',
  'PurchaseInvoice',
  'Payment',
  'JournalEntry',
  'Customer',
  'Supplier',
  'Item',
];

type Exclusion = {
  [key: string]: string[];
};

type Map = {
  [key: string]: string | boolean | object;
};

interface TemplateField {
  label: string;
  fieldname: string;
  required: boolean;
  doctype: string;
  options?: string[];
  fieldtype: FieldType;
}

const exclusion: Exclusion = {
  Item: ['image'],
  Supplier: ['address', 'outstandingAmount', 'supplier', 'image', 'customer'],
  Customer: ['address', 'outstandingAmount', 'supplier', 'image', 'customer'],
};

function getFilteredDocFields(doctype: string): [TemplateField[], string[]] {
  const fields: TemplateField[] = [];
  // @ts-ignore
  const primaryFields: Field[] = frappe.models[doctype].fields;
  const tableTypes: string[] = [];
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
        readOnly ||
        (hidden && typeof hidden === 'number') ||
        exclusionFields.includes(fieldname)
      ) {
        return;
      }

      if (fieldtype === FieldType.Table && childtype) {
        tableTypes.push(childtype);
        return;
      }

      fields.push({
        label,
        fieldname,
        doctype,
        options,
        fieldtype,
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
  const doctypes: string[] = [doctype];
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
  labelFieldMap: Map = {};

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
    this.labelFieldMap = this.templateFields.reduce((acc: Map, k) => {
      acc[k.label] = k;
      return acc;
    }, {});
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
    const csv = parseCSV(text);
    this.parsedLabels = csv[0];
    const values = csv.slice(1);

    if (values.some((v) => v.length !== this.parsedLabels.length)) {
      return false;
    }

    this.parsedValues = values;
    this._setAssigned();
    return true;
  }

  _setAssigned() {
    const labels = [...this.parsedLabels];
    labels.forEach((l) => {
      if (this.assignedMap[l] !== '') {
        return;
      }

      this.assignedMap[l] = l;
    });
  }
}

// @ts-ignore
window.im = importable;
// @ts-ignore
window.gtf = getTemplateFields;
