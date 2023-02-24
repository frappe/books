import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, Schema, TargetField } from 'schemas/types';
import { getSavePath, makePDF } from './ipcCalls';

type PrintTemplateData = Record<string, unknown>;

const printSettingsFields = [
  'logo',
  'displayLogo',
  'displayTaxInvoice',
  'color',
  'font',
  'email',
  'phone',
  'address',
];
const accountingSettingsFields = ['companyName', 'gstin'];

export async function getPrintTemplatePropValues(doc: Doc) {
  const fyo = doc.fyo;
  const values: PrintTemplateData = {};
  values.doc = await getPrintTemplateDocValues(doc);
  (values.doc as PrintTemplateData).entryType = doc.schema.name;
  (values.doc as PrintTemplateData).entryLabel = doc.schema.label;

  const printSettings = await fyo.doc.getDoc(ModelNameEnum.PrintSettings);
  const printValues = await getPrintTemplateDocValues(
    printSettings,
    printSettingsFields
  );

  const accountingSettings = await fyo.doc.getDoc(
    ModelNameEnum.AccountingSettings
  );
  const accountingValues = await getPrintTemplateDocValues(
    accountingSettings,
    accountingSettingsFields
  );

  values.print = {
    ...printValues,
    ...accountingValues,
  };

  if (doc.schemaName?.endsWith('Invoice')) {
    (values.doc as PrintTemplateData).totalDiscount =
      formattedTotalDiscount(doc);
    (values.doc as PrintTemplateData).showHSN = showHSN(doc);
  }

  return values;
}

export function getPrintTemplatePropHints(doc: Doc) {
  const hints: PrintTemplateData = {};
  const fyo = doc.fyo;
  hints.doc = getPrintTemplateDocHints(doc.schema, doc.fyo);
  (hints.doc as PrintTemplateData).entryType = doc.fyo.t`Entry Type`;
  (hints.doc as PrintTemplateData).entryLabel = doc.fyo.t`Entry Label`;

  const printSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.PrintSettings]!,
    doc.fyo,
    printSettingsFields
  );
  const accountingSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.AccountingSettings]!,
    doc.fyo,
    accountingSettingsFields
  );

  hints.print = {
    ...printSettingsHints,
    ...accountingSettingsHints,
  };

  if (doc.schemaName?.endsWith('Invoice')) {
    (hints.doc as PrintTemplateData).totalDiscount = fyo.t`Total Discount`;
    (hints.doc as PrintTemplateData).showHSN = fyo.t`Show HSN`;
  }

  return hints;
}

function showHSN(doc: Doc): boolean {
  if (!Array.isArray(doc.items)) {
    return false;
  }

  return doc.items.map((i) => i.hsnCode).every(Boolean);
}

function formattedTotalDiscount(doc: Doc): string {
  if (!(doc instanceof Invoice)) {
    return '';
  }

  const totalDiscount = doc.getTotalDiscount();
  if (!totalDiscount?.float) {
    return '';
  }

  return doc.fyo.format(totalDiscount, ModelNameEnum.Currency);
}

function getPrintTemplateDocHints(
  schema: Schema,
  fyo: Fyo,
  fieldnames?: string[],
  isLink?: boolean
): PrintTemplateData {
  isLink ??= false;
  const hints: PrintTemplateData = {};
  const links: PrintTemplateData = {};

  let fields = schema.fields;
  if (fieldnames) {
    fields = fields.filter((f) => fieldnames.includes(f.fieldname));
  }

  for (const field of fields) {
    const { fieldname, fieldtype, label, meta } = field;
    if (fieldtype === FieldTypeEnum.Attachment || meta) {
      continue;
    }

    hints[fieldname] = label ?? fieldname;
    if (fieldtype === FieldTypeEnum.Table) {
    }

    const { target } = field as TargetField;
    const targetSchema = fyo.schemaMap[target];
    if (fieldtype === FieldTypeEnum.Link && targetSchema && !isLink) {
      links[fieldname] = getPrintTemplateDocHints(
        targetSchema,
        fyo,
        undefined,
        true
      );
    }

    if (fieldtype === FieldTypeEnum.Table && targetSchema) {
      hints[fieldname] = [getPrintTemplateDocHints(targetSchema, fyo)];
    }
  }

  if (Object.keys(links).length) {
    hints.links = links;
  }
  return hints;
}

async function getPrintTemplateDocValues(doc: Doc, fieldnames?: string[]) {
  const values: PrintTemplateData = {};
  if (!(doc instanceof Doc)) {
    return values;
  }

  let fields = doc.schema.fields;
  if (fieldnames) {
    fields = fields.filter((f) => fieldnames.includes(f.fieldname));
  }

  // Set Formatted Doc Data
  for (const field of fields) {
    const { fieldname, fieldtype, meta } = field;
    if (fieldtype === FieldTypeEnum.Attachment || meta) {
      continue;
    }

    const value = doc.get(fieldname);

    if (!value) {
      values[fieldname] = '';
      continue;
    }

    if (!Array.isArray(value)) {
      values[fieldname] = doc.fyo.format(value, field, doc);
      continue;
    }

    const table: PrintTemplateData[] = [];
    for (const row of value) {
      const rowProps = await getPrintTemplateDocValues(row);
      table.push(rowProps);
    }

    values[fieldname] = table;
  }

  // Set Formatted Doc Link Data
  await doc.loadLinks();
  const links: PrintTemplateData = {};
  for (const [linkName, linkDoc] of Object.entries(doc.links ?? {})) {
    if (fieldnames && !fieldnames.includes(linkName)) {
      continue;
    }

    links[linkName] = await getPrintTemplateDocValues(linkDoc);
  }

  if (Object.keys(links).length) {
    values.links = links;
  }
  return values;
}

export async function getPathAndMakePDF(name: string, innerHTML: string) {
  const { filePath } = await getSavePath(name, 'pdf');
  if (!filePath) {
    return;
  }

  const html = constructPrintDocument(innerHTML);
  await makePDF(html, filePath);
}

function constructPrintDocument(innerHTML: string) {
  const html = document.createElement('html');
  const head = document.createElement('head');
  const body = document.createElement('body');
  const style = getAllCSSAsStyleElem();

  head.innerHTML = [
    '<meta charset="UTF-8">',
    '<title>Print Window</title>',
  ].join('\n');
  head.append(style);

  body.innerHTML = innerHTML;
  html.append(head, body);
  return html.outerHTML;
}

function getAllCSSAsStyleElem() {
  const cssTexts = [];
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      cssTexts.push(rule.cssText);
    }

    // @ts-ignore
    for (const rule of sheet.ownerRule ?? []) {
      cssTexts.push(rule.cssText);
    }
  }

  const styleElem = document.createElement('style');
  styleElem.innerHTML = cssTexts.join('\n');
  return styleElem;
}
