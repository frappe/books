import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, Schema, TargetField } from 'schemas/types';
import { getValueMapFromList } from 'utils/index';
import { TemplateFile } from 'utils/types';
import { getSavePath, getTemplates, makePDF } from './ipcCalls';
import { PrintValues } from './types';
import { getDocFromNameIfExistsElseNew } from './ui';

type PrintTemplateData = Record<string, unknown>;
type TemplateUpdateItem = { name: string; template: string; type: string };

const printSettingsFields = [
  'logo',
  'displayLogo',
  'color',
  'font',
  'email',
  'phone',
  'address',
  'companyName',
];
const accountingSettingsFields = ['gstin'];

export async function getPrintTemplatePropValues(
  doc: Doc
): Promise<PrintValues> {
  const fyo = doc.fyo;
  const values: PrintValues = { doc: {}, print: {} };
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

export function getPrintTemplatePropHints(schemaName: string, fyo: Fyo) {
  const hints: PrintTemplateData = {};
  const schema = fyo.schemaMap[schemaName]!;
  hints.doc = getPrintTemplateDocHints(schema, fyo);
  (hints.doc as PrintTemplateData).entryType = fyo.t`Entry Type`;
  (hints.doc as PrintTemplateData).entryLabel = fyo.t`Entry Label`;

  const printSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.PrintSettings]!,
    fyo,
    printSettingsFields
  );
  const accountingSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.AccountingSettings]!,
    fyo,
    accountingSettingsFields
  );

  hints.print = {
    ...printSettingsHints,
    ...accountingSettingsHints,
  };

  if (schemaName?.endsWith('Invoice')) {
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
  linkLevel?: number
): PrintTemplateData {
  linkLevel ??= 0;
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
    const { target } = field as TargetField;
    const targetSchema = fyo.schemaMap[target];
    if (fieldtype === FieldTypeEnum.Link && targetSchema && linkLevel < 2) {
      links[fieldname] = getPrintTemplateDocHints(
        targetSchema,
        fyo,
        undefined,
        linkLevel + 1
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

export async function getPathAndMakePDF(
  name: string,
  innerHTML: string,
  width: number,
  height: number
) {
  const { filePath } = await getSavePath(name, 'pdf');
  if (!filePath) {
    return;
  }

  const html = constructPrintDocument(innerHTML);
  await makePDF(html, filePath, width, height);
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

export async function updatePrintTemplates(fyo: Fyo) {
  const templateFiles = await getTemplates();
  const existingTemplates = (await fyo.db.getAll(ModelNameEnum.PrintTemplate, {
    fields: ['name', 'modified'],
    filters: { isCustom: false },
  })) as { name: string; modified: Date }[];

  const nameModifiedMap = getValueMapFromList(
    existingTemplates,
    'name',
    'modified'
  );

  const updateList: TemplateUpdateItem[] = [];
  for (const templateFile of templateFiles) {
    const updates = getPrintTemplateUpdateList(
      templateFile,
      nameModifiedMap,
      fyo
    );

    updateList.push(...updates);
  }

  for (const { name, type, template } of updateList) {
    const doc = await getDocFromNameIfExistsElseNew(
      ModelNameEnum.PrintTemplate,
      name
    );

    await doc.set({ name, type, template, isCustom: false });
    await doc.sync();
  }
}

function getPrintTemplateUpdateList(
  { file, template, modified: modifiedString }: TemplateFile,
  nameModifiedMap: Record<string, Date>,
  fyo: Fyo
): TemplateUpdateItem[] {
  const templateList: TemplateUpdateItem[] = [];
  const dbModified = new Date(modifiedString);

  for (const { name, type } of getNameAndTypeFromTemplateFile(file, fyo)) {
    const fileModified = nameModifiedMap[name];
    if (fileModified && dbModified.valueOf() >= fileModified.valueOf()) {
      continue;
    }

    templateList.push({
      name,
      type,
      template,
    });
  }
  return templateList;
}

function getNameAndTypeFromTemplateFile(
  file: string,
  fyo: Fyo
): { name: string; type: string }[] {
  /**
   * Template File Name Format:
   * TemplateName[.SchemaName].template.html
   *
   * If the SchemaName is absent then it is assumed
   * that the SchemaName is:
   * - SalesInvoice
   * - PurchaseInvoice
   */

  const fileName = file.split('.template.html')[0];
  const name = fileName.split('.')[0];
  const schemaName = fileName.split('.')[1];

  if (schemaName) {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return [{ name: `${name} - ${label}`, type: schemaName }];
  }

  return [ModelNameEnum.SalesInvoice, ModelNameEnum.PurchaseInvoice].map(
    (schemaName) => {
      const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
      return { name: `${name} - ${label}`, type: schemaName };
    }
  );
}

export const baseTemplate = `<main class="h-full w-full bg-white">

  <!-- Edit This Code -->
  <header class="p-4 flex justify-between border-b">
    <h2 
      class="font-semibold text-2xl" 
      :style="{ color: print.color }"
    >
      {{ print.companyName }}
    </h2>
    <h2 class="font-semibold text-2xl" >
      {{ doc.name }}
    </h2>
  </header>

  <div class="p-4 text-gray-600">
    Edit the code in the Template Editor on the right
    to create your own personalized custom template.
  </div>

</main>
`;
