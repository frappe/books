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
  [key: string]: string;
};

interface TemplateField {
  label: string;
  fieldname: string;
  required: boolean;
}

const exclusion: Exclusion = {
  Item: ['image'],
};

function getTemplateFields(doctype: string): TemplateField[] {
  const fields: TemplateField[] = [];
  if (!doctype) {
    return [];
  }

  // @ts-ignore
  const primaryFields: Field[] = frappe.models[doctype].fields;
  const tableTypes: string[] = [];
  let exclusionFields: string[] = exclusion[doctype] ?? [];

  primaryFields.forEach(
    ({ label, fieldtype, childtype, fieldname, required }) => {
      if (exclusionFields.includes(fieldname)) {
        return;
      }

      if (fieldtype === FieldType.Table && childtype) {
        tableTypes.push(childtype);
      }

      fields.push({
        label,
        fieldname,
        required: Boolean(required ?? false),
      });
    }
  );

  tableTypes.forEach((childtype) => {
    exclusionFields = exclusion[childtype] ?? [];

    // @ts-ignore
    const childFields: Field[] = frappe.models[childtype].fields;
    childFields.forEach(({ label, fieldtype, fieldname, required }) => {
      if (
        exclusionFields.includes(fieldname) ||
        fieldtype === FieldType.Table
      ) {
        return;
      }

      fields.push({ label, fieldname, required: Boolean(required ?? false) });
    });
  });

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

  constructor(doctype: string) {
    this.doctype = doctype;
    this.templateFields = getTemplateFields(doctype);
    this.map = getLabelFieldMap(this.templateFields);
    this.template = getTemplate(this.templateFields);
    this.assignedMap = this.assignableLabels.reduce((acc: Map, k) => {
      acc[k] = '';
      return acc;
    }, {});
  }

  get assignableLabels() {
    return Object.keys(this.map);
  }

  get unassignedLabels() {
    const assigned = Object.keys(this.assignedMap).map(
      (k) => this.assignedMap[k]
    );
    return this.parsedLabels.filter((l) => !assigned.includes(l));
  }

  get columnLabels() {
    const assigned: string[] = [];
    const unassigned: string[] = [];

    this.assignableLabels.forEach((k) => {
      if (this.assignedMap[k]) {
        assigned.push(k);
        return;
      }
      unassigned.push(k);
    });

    return [...assigned];
  }

  get assignedMatrix() {
    this.indices = this.columnLabels
      .map((k) => this.assignedMap[k])
      .filter(Boolean)
      .map((k) => this.parsedLabels.indexOf(k));

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
window.pc = parseCSV;
