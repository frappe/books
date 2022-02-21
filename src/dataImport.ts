import { Field, FieldType } from '@/types/model';
import frappe from 'frappe';

export const importable = [
  'SalesInvoice',
  'PurchaseInvoice',
  'Payment',
  'JournalEntry',
  'Customer',
  'Supplier',
  'Item',
];

interface TemplateField {
  label: string;
  fieldname: string;
  required: boolean;
}

type LabelFieldMap = {
  [key: string]: string;
};

export function getTemplateFields(doctype: string): TemplateField[] {
  const fields: TemplateField[] = [];

  // @ts-ignore
  const primaryFields: Field[] = frappe.models[doctype].fields;
  const tableTypes: string[] = [];

  primaryFields.forEach(
    ({ label, fieldtype, childtype, fieldname, required }) => {
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
    // @ts-ignore
    const childFields: Field[] = frappe.models[childtype].fields;
    childFields.forEach(({ label, fieldtype, fieldname, required }) => {
      if (fieldtype === FieldType.Table) {
        return;
      }

      fields.push({ label, fieldname, required: Boolean(required ?? false) });
    });
  });

  return fields;
}

function getLabelFieldMap(templateFields: TemplateField[]): LabelFieldMap {
  const map: LabelFieldMap = {};

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
  _map: LabelFieldMap;
  _template: string;

  constructor(doctype: string) {
    this.doctype = doctype;
    this.templateFields = getTemplateFields(doctype);
    this._map = getLabelFieldMap(this.templateFields);
    this._template = getTemplate(this.templateFields);
  }

  get map() {
    return this._map;
  }

  get template() {
    return this._template;
  }
}
