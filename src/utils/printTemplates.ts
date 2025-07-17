import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, Schema, TargetField } from 'schemas/types';
import { getValueMapFromList } from 'utils/index';
import { TemplateFile } from 'utils/types';
import { showToast } from './interactive';
import { PrintValues } from './types';
import {
  getDocFromNameIfExistsElseNew,
  getSavePath,
  showExportInFolder,
} from './ui';
import { Money } from 'pesa';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { Payment } from 'models/baseModels/Payment/Payment';

export type PrintTemplateHint = {
  [key: string]: string | PrintTemplateHint | PrintTemplateHint[];
};
type PrintTemplateData = Record<string, unknown>;
type TemplateUpdateItem = {
  name: string;
  template: string;
  type: string;
  width: number;
  height: number;
};

const printSettingsFields = [
  'logo',
  'displayLogo',
  'color',
  'font',
  'email',
  'phone',
  'address',
  'companyName',
  'amountInWords',
];
const accountingSettingsFields = ['gstin', 'taxId'];

export async function getPrintTemplatePropValues(
  doc: Doc
): Promise<PrintValues> {
  const fyo = doc.fyo;
  let paymentId;
  let sinvDoc;

  const values: PrintValues = { doc: {}, print: {} };
  values.doc = await getPrintTemplateDocValues(doc);

  if (
    values.doc.entryType === ModelNameEnum.SalesInvoice ||
    values.doc.entryType === ModelNameEnum.PurchaseInvoice
  ) {
    paymentId = await (doc as SalesInvoice).getPaymentIds();

    if (paymentId && paymentId.length) {
      const paymentDetails = await getPaymentDetails(doc, paymentId);
      (values.doc as PrintTemplateData).paymentDetails = paymentDetails;
    }
  }

  if (doc.referenceType == ModelNameEnum.SalesInvoice) {
    const referenceName = (doc as Payment)?.for![0]?.referenceName;

    if (referenceName) {
      sinvDoc = await fyo.doc.getDoc(ModelNameEnum.SalesInvoice, referenceName);

      if (sinvDoc.taxes) {
        (values.doc as PrintTemplateData).taxes = sinvDoc.taxes;
      }
    }
  }

  let totalTax;

  if (values.doc.entryType !== ModelNameEnum.Shipment) {
    totalTax = await ((sinvDoc as Invoice) ?? (doc as Payment))?.getTotalTax();
  }

  if (doc.schema.name == ModelNameEnum.Payment) {
    (values.doc as PrintTemplateData).amountPaidInWords = getGrandTotalInWords(
      (doc.amountPaid as Money)?.float
    );
  }

  (values.doc as PrintTemplateData).subTotal = doc.fyo.format(
    ((doc.grandTotal as Money) ?? (doc.amount as Money)).sub(totalTax || 0),
    ModelNameEnum.Currency
  );

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
  const discountSchema = ['Invoice', 'Quote'];
  if (discountSchema.some((value) => doc.schemaName?.endsWith(value))) {
    (values.doc as PrintTemplateData).totalDiscount =
      formattedTotalDiscount(doc);
  }
  (values.doc as PrintTemplateData).showHSN = showHSN(doc);

  (values.doc as PrintTemplateData).grandTotalInWords = getGrandTotalInWords(
    ((doc.grandTotal as Money) ?? (doc.amount as Money)).float
  );

  (values.doc as PrintTemplateData).date = getDate(doc.date as string);

  if (printSettings.displayTime) {
    (values.doc as PrintTemplateData).time = getTime(doc.date as string);
  }

  if (printSettings.displayDescription) {
    (values.doc as PrintTemplateData).description = showDescription(doc);
  }

  return values;
}
async function getPaymentDetails(doc: Doc, paymentId: string[]) {
  const paymentIds = paymentId.sort();
  const paymentDetails = [];
  let outstandingAmount = doc.grandTotal as Money;

  for (const payment of paymentIds) {
    const paymentDoc = await doc.fyo.doc.getDoc(ModelNameEnum.Payment, payment);
    outstandingAmount = outstandingAmount.sub(paymentDoc.amount as Money);

    paymentDetails.push({
      amount: doc.fyo.format(paymentDoc.amount, ModelNameEnum.Currency),
      amountPaid: doc.fyo.format(paymentDoc.amountPaid, ModelNameEnum.Currency),
      paymentMethod: paymentDoc.paymentMethod as string,
      outstandingAmount: doc.fyo.format(
        outstandingAmount,
        ModelNameEnum.Currency
      ),
    });
  }

  return paymentDetails;
}

function getDate(dateString: string): string {
  const date = new Date(dateString);
  date.setMonth(date.getMonth());

  return `${date.toLocaleString('default', {
    month: 'short',
  })} ${date.getDate()}, ${date.getFullYear()}`;
}

function getTime(dateString: string): string {
  const date = new Date(dateString);

  return date.toTimeString().split(' ')[0];
}

export function getPrintTemplatePropHints(schemaName: string, fyo: Fyo) {
  const hints: PrintTemplateHint = {};
  const schema = fyo.schemaMap[schemaName]!;
  hints.doc = getPrintTemplateDocHints(schema, fyo);

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

function getGrandTotalInWords(total: number) {
  const formattedTotal = total.toFixed(2);

  const [integerPart, decimalPart] = formattedTotal.split('.');

  const ones = [
    '',
    t`One`,
    t`Two`,
    t`Three`,
    t`Four`,
    t`Five`,
    t`Six`,
    t`Seven`,
    t`Eight`,
    t`Nine`,
  ];

  const teens = [
    t`Ten`,
    t`Eleven`,
    t`Twelve`,
    t`Thirteen`,
    t`Fourteen`,
    t`Fifteen`,
    t`Sixteen`,
    t`Seventeen`,
    t`Eighteen`,
    t`Nineteen`,
  ];

  const tens = [
    '',
    '',
    t`Twenty`,
    t`Thirty`,
    t`Forty`,
    t`Fifty`,
    t`Sixty`,
    t`Seventy`,
    t`Eighty`,
    t`Ninety`,
  ];

  const scales = ['', t`Thousand`, t`Million`, t`Billion`];

  function convertThreeDigitNumber(num: number) {
    let result = '';

    const hundredDigit = Math.floor(num / 100);
    const remainder = num % 100;

    if (hundredDigit > 0) {
      result += ones[hundredDigit] + ` ${t`Hundred`}`;
    }

    if (remainder > 0) {
      if (hundredDigit > 0) {
        result += ` ${t`And`} `;
      }

      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        const tensDigit = Math.floor(remainder / 10);
        const onesDigit = remainder % 10;
        result += tens[tensDigit];
        if (onesDigit > 0) {
          result += ' ' + ones[onesDigit];
        }
      }
    }

    return result;
  }

  let spelledOutInteger = '';
  const integerGroups = integerPart.match(/(\d{1,3})(?=(\d{3})*$)/g) || [];
  const groupCount = integerGroups.length;

  integerGroups.forEach((group, index) => {
    const groupValue = parseInt(group);

    if (groupValue > 0) {
      const groupText = convertThreeDigitNumber(groupValue);
      const groupSuffix = scales[groupCount - index - 1];
      spelledOutInteger +=
        groupText + (groupSuffix ? ' ' + groupSuffix : '') + ' ';
    }
  });

  spelledOutInteger = spelledOutInteger.trim() || t`Zero`;

  let spelledOutDecimal = '';
  const decimalCents = parseInt(decimalPart);

  if (decimalCents !== 0) {
    spelledOutDecimal =
      ` ${t`and`} ` + convertThreeDigitNumber(decimalCents) + ` ${t`Paisa`}`;
  }

  return `${spelledOutInteger}${spelledOutDecimal} ${t`only`}`;
}

function showHSN(doc: Doc): boolean {
  const items = doc.items;
  if (!Array.isArray(items)) {
    return false;
  }

  return items.map((i: Doc) => i.hsnCode).every(Boolean);
}

function showDescription(doc: Doc): boolean {
  const description = Array.isArray(doc.items)
    ? doc.items.map((item: Doc) => item.description).filter(Boolean)
    : [];
  return description.length > 0;
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
): PrintTemplateHint {
  linkLevel ??= 0;
  const hints: PrintTemplateHint = {};
  const links: PrintTemplateHint = {};

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

  hints.submitted = fyo.t`Submitted`;
  hints.entryType = fyo.t`Entry Type`;
  hints.entryLabel = fyo.t`Entry Label`;

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

  values.submitted = doc.submitted;
  values.entryType = doc.schema.name;
  values.entryLabel = doc.schema.label;

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
  height: number,
  shouldPrint?: boolean
) {
  if (!shouldPrint) {
    const { filePath: savePath } = await getSavePath(name, 'pdf');
    if (!savePath) {
      return;
    }

    const html = constructPrintDocument(innerHTML);
    const success = await ipc.makePDF(html, savePath, width, height);
    if (success) {
      showExportInFolder(t`Save as PDF Successful`, savePath);
    } else {
      showToast({ message: t`Export Failed`, type: 'error' });
    }
  } else {
    const html = constructPrintDocument(innerHTML);
    const success = await ipc.printDocument(html, width, height);
    if (success) {
      showToast({ message: t`Print Successful`, type: 'success' });
    } else {
      showToast({ message: t`Print Failed`, type: 'error' });
    }
  }
}

function constructPrintDocument(innerHTML: string) {
  const html = document.createElement('html');
  const head = document.createElement('head');
  const body = document.createElement('body');
  const style = getAllCSSAsStyleElem();

  const printCSS = document.createElement('style');
  printCSS.innerHTML = `
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white;
      }

      @page {
        margin: 0;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
    }
  `;

  head.innerHTML = [
    '<meta charset="UTF-8">',
    '<title>Print Window</title>',
  ].join('\n');

  head.append(style, printCSS);

  body.innerHTML = innerHTML;
  html.append(head, body);
  return html.outerHTML;
}

function getAllCSSAsStyleElem() {
  const cssTexts: string[] = [];
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      cssTexts.push(rule.cssText);
    }

    if (sheet.ownerRule) {
      cssTexts.push(sheet.ownerRule.cssText);
    }
  }

  const styleElem = document.createElement('style');
  styleElem.innerHTML = cssTexts.join('\n');
  return styleElem;
}

export async function updatePrintTemplates(fyo: Fyo) {
  const templateFiles = await ipc.getTemplates(
    fyo.singles.PrintSettings?.posPrintWidth as number
  );
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

  const isLogging = fyo.store.skipTelemetryLogging;
  fyo.store.skipTelemetryLogging = true;
  for (const { name, type, template, width, height } of updateList) {
    const doc = await getDocFromNameIfExistsElseNew(
      ModelNameEnum.PrintTemplate,
      name
    );

    const updateData = {
      name,
      type,
      template,
      isCustom: false,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    };

    await doc.set(updateData);
    await doc.sync();
  }
  fyo.store.skipTelemetryLogging = isLogging;
}

function getPrintTemplateUpdateList(
  { file, template, modified: modifiedString, width, height }: TemplateFile,
  nameModifiedMap: Record<string, Date>,
  fyo: Fyo
): TemplateUpdateItem[] {
  const templateList: TemplateUpdateItem[] = [];
  const dbModified = new Date(modifiedString);

  for (const { name, type } of getNameAndTypeFromTemplateFile(file, fyo)) {
    const fileModified = nameModifiedMap[name];
    if (fileModified && dbModified.valueOf() <= fileModified.valueOf()) {
      continue;
    }

    templateList.push({
      height,
      width,
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
   * - SalesQuote
   * - PurchaseInvoice
   */

  const fileName = file.split('.template.html')[0];
  const name = fileName.split('.')[0];
  const schemaName = fileName.split('.')[1];

  if (schemaName) {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return [{ name: `${name} - ${label}`, type: schemaName }];
  }

  return [
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.SalesQuote,
    ModelNameEnum.PurchaseInvoice,
  ].map((schemaName) => {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return { name: `${name} - ${label}`, type: schemaName };
  });
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
