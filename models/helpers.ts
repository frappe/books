import {
  AccountRootType,
  AccountRootTypeEnum,
} from './baseModels/Account/types';
import {
  Action,
  ColumnConfig,
  DocStatus,
  LeadStatus,
  RenderData,
} from 'fyo/model/types';
import { Fyo, t } from 'fyo';
import { InvoiceStatus, ModelNameEnum } from './types';

import {
  ApplicableCouponCodes,
  ApplicablePricingRules,
} from './baseModels/Invoice/types';
import { AppliedCouponCodes } from './baseModels/AppliedCouponCodes/AppliedCouponCodes';
import { CollectionRulesItems } from './baseModels/CollectionRulesItems/CollectionRulesItems';
import { CouponCode } from './baseModels/CouponCode/CouponCode';
import { DateTime } from 'luxon';
import { Doc } from 'fyo/model/doc';
import { Invoice } from './baseModels/Invoice/Invoice';
import { Lead } from './baseModels/Lead/Lead';
import { LoyaltyProgram } from './baseModels/LoyaltyProgram/LoyaltyProgram';
import { Money } from 'pesa';
import { Party } from './baseModels/Party/Party';
import { PricingRule } from './baseModels/PricingRule/PricingRule';
import { Router } from 'vue-router';
import { Item } from 'models/baseModels/Item/Item';
import { SalesInvoice } from './baseModels/SalesInvoice/SalesInvoice';
import { SalesQuote } from './baseModels/SalesQuote/SalesQuote';
import { StockMovement } from './inventory/StockMovement';
import { StockTransfer } from './inventory/StockTransfer';
import { ValidationError } from 'fyo/utils/errors';
import { isPesa } from 'fyo/utils';
import { numberSeriesDefaultsMap } from './baseModels/Defaults/Defaults';
import { safeParseFloat } from 'utils/index';
import { PriceList } from './baseModels/PriceList/PriceList';
import { InvoiceItem } from './baseModels/InvoiceItem/InvoiceItem';
import { SalesInvoiceItem } from './baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { ItemQtyMap } from 'src/components/POS/types';
import { ValuationMethod } from './inventory/types';
import {
  getRawStockLedgerEntries,
  getStockBalanceEntries,
  getStockLedgerEntries,
} from 'reports/inventory/helpers';

export function getQuoteActions(
  fyo: Fyo,
  schemaName: ModelNameEnum.SalesQuote
): Action[] {
  return [getMakeInvoiceAction(fyo, schemaName)];
}

export function getLeadActions(fyo: Fyo): Action[] {
  return [getCreateCustomerAction(fyo), getSalesQuoteAction(fyo)];
}

export function getInvoiceActions(
  fyo: Fyo,
  schemaName: ModelNameEnum.SalesInvoice | ModelNameEnum.PurchaseInvoice
): Action[] {
  return [
    getMakePaymentAction(fyo),
    getMakeStockTransferAction(fyo, schemaName),
    getLedgerLinkAction(fyo),
    getMakeReturnDocAction(fyo),
  ];
}

export async function getItemQtyMap(doc: SalesInvoice): Promise<ItemQtyMap> {
  const itemQtyMap: ItemQtyMap = {};
  const valuationMethod =
    (doc.fyo.singles.InventorySettings?.valuationMethod as ValuationMethod) ??
    ValuationMethod.FIFO;

  const rawSLEs = await getRawStockLedgerEntries(doc.fyo);
  const rawData = getStockLedgerEntries(rawSLEs, valuationMethod);

  const posProfileName = doc.fyo.singles.POSSettings?.posProfile;
  let inventoryLocation: string | undefined;

  if (posProfileName) {
    const posProfile = await doc.fyo.doc.getDoc(
      ModelNameEnum.POSProfile,
      posProfileName as string
    );

    inventoryLocation = posProfile?.inventory as string | undefined;
  } else {
    inventoryLocation = doc.fyo.singles.POSSettings?.inventory;
  }

  const stockBalance = getStockBalanceEntries(rawData, {
    location: inventoryLocation,
  });

  for (const row of stockBalance) {
    if (!itemQtyMap[row.item]) {
      itemQtyMap[row.item] = { availableQty: 0 };
    }

    if (row.batch) {
      itemQtyMap[row.item][row.batch] = row.balanceQuantity;
    }

    itemQtyMap[row.item]!.availableQty += row.balanceQuantity;
  }
  return itemQtyMap;
}

export function getStockTransferActions(
  fyo: Fyo,
  schemaName: ModelNameEnum.Shipment | ModelNameEnum.PurchaseReceipt
): Action[] {
  return [
    getMakeInvoiceAction(fyo, schemaName),
    getLedgerLinkAction(fyo, false),
    getLedgerLinkAction(fyo, true),
    getMakeReturnDocAction(fyo),
  ];
}

export function getMakeStockTransferAction(
  fyo: Fyo,
  schemaName: ModelNameEnum.SalesInvoice | ModelNameEnum.PurchaseInvoice
): Action {
  let label = fyo.t`Shipment`;
  if (schemaName === ModelNameEnum.PurchaseInvoice) {
    label = fyo.t`Purchase Receipt`;
  }

  return {
    label,
    group: fyo.t`Create`,
    condition: (doc: Doc) => doc.isSubmitted && !!doc.stockNotTransferred,
    action: async (doc: Doc) => {
      const transfer = await (doc as Invoice).getStockTransfer();
      if (!transfer || !transfer.name) {
        return;
      }

      const { routeTo } = await import('src/utils/ui');
      const path = `/edit/${transfer.schemaName}/${transfer.name}`;
      await routeTo(path);
    },
  };
}

export function getMakeInvoiceAction(
  fyo: Fyo,
  schemaName:
    | ModelNameEnum.Shipment
    | ModelNameEnum.PurchaseReceipt
    | ModelNameEnum.SalesQuote
): Action {
  let label = fyo.t`Sales Invoice`;
  if (schemaName === ModelNameEnum.PurchaseReceipt) {
    label = fyo.t`Purchase Invoice`;
  }

  return {
    label,
    group: fyo.t`Create`,
    condition: (doc: Doc) => {
      if (schemaName === ModelNameEnum.SalesQuote) {
        return doc.isSubmitted;
      } else {
        return doc.isSubmitted && !doc.backReference;
      }
    },
    action: async (doc: Doc) => {
      const invoice = await (doc as SalesQuote | StockTransfer).getInvoice();
      if (!invoice || !invoice.name) {
        return;
      }

      const { routeTo } = await import('src/utils/ui');
      const path = `/edit/${invoice.schemaName}/${invoice.name}`;
      await routeTo(path);
    },
  };
}

export function getCreateCustomerAction(fyo: Fyo): Action {
  return {
    group: fyo.t`Create`,
    label: fyo.t`Customer`,
    condition: (doc: Doc) => !doc.notInserted,
    action: async (doc: Doc, router) => {
      const customerData = (doc as Lead).createCustomer();

      if (!customerData.name) {
        return;
      }
      await router.push(`/edit/Party/${customerData.name}`);
    },
  };
}

export function getSalesQuoteAction(fyo: Fyo): Action {
  return {
    group: fyo.t`Create`,
    label: fyo.t`Sales Quote`,
    condition: (doc: Doc) => !doc.notInserted,
    action: async (doc, router) => {
      const salesQuoteData = (doc as Lead).createSalesQuote();
      if (!salesQuoteData.name) {
        return;
      }
      await router.push(`/edit/SalesQuote/${salesQuoteData.name}`);
    },
  };
}

export function getMakePaymentAction(fyo: Fyo): Action {
  return {
    label: fyo.t`Payment`,
    group: fyo.t`Create`,
    condition: (doc: Doc) =>
      doc.isSubmitted && !(doc.outstandingAmount as Money).isZero(),
    action: async (doc, router) => {
      const schemaName = doc.schema.name;
      const payment = (doc as Invoice).getPayment();
      if (!payment) {
        return;
      }

      await payment?.set('referenceType', schemaName);
      const currentRoute = router.currentRoute.value.fullPath;
      payment.once('afterSync', async () => {
        await payment.submit();
        await doc.load();
        await router.push(currentRoute);
      });

      const hideFields = ['party', 'for'];

      if (!fyo.singles.AccountingSettings?.enableInvoiceReturns) {
        hideFields.push('paymentType');
      }

      if (doc.schemaName === ModelNameEnum.SalesInvoice) {
        hideFields.push('account');
      } else {
        hideFields.push('paymentAccount');
      }

      await payment.runFormulas();
      const { openQuickEdit } = await import('src/utils/ui');
      await openQuickEdit({
        doc: payment,
        hideFields,
      });
    },
  };
}

export function getLedgerLinkAction(fyo: Fyo, isStock = false): Action {
  let label = fyo.t`Accounting Entries`;
  let reportClassName: 'GeneralLedger' | 'StockLedger' = 'GeneralLedger';

  if (isStock) {
    label = fyo.t`Stock Entries`;
    reportClassName = 'StockLedger';
  }

  return {
    label,
    group: fyo.t`View`,
    condition: (doc: Doc) => doc.isSubmitted,
    action: async (doc: Doc, router: Router) => {
      const route = getLedgerLink(doc, reportClassName);
      await router.push(route);
    },
  };
}

export function getLedgerLink(
  doc: Doc,
  reportClassName: 'GeneralLedger' | 'StockLedger'
) {
  return {
    name: 'Report',
    params: {
      reportClassName,
      defaultFilters: JSON.stringify({
        referenceType: doc.schemaName,
        referenceName: doc.name,
      }),
    },
  };
}
export function getMakeReturnDocAction(fyo: Fyo): Action {
  return {
    label: fyo.t`Return`,
    group: fyo.t`Create`,
    condition: (doc: Doc) =>
      (!!fyo.singles.AccountingSettings?.enableInvoiceReturns ||
        !!fyo.singles.InventorySettings?.enableStockReturns) &&
      doc.isSubmitted &&
      !doc.isReturn,
    action: async (doc: Doc) => {
      let returnDoc: Invoice | StockTransfer | undefined;

      if (doc instanceof Invoice || doc instanceof StockTransfer) {
        returnDoc = await doc.getReturnDoc();
      }

      if (!returnDoc || !returnDoc.name) {
        return;
      }

      const { routeTo } = await import('src/utils/ui');
      const path = `/edit/${doc.schemaName}/${returnDoc.name}`;
      await routeTo(path);
    },
  };
}

export function getTransactionStatusColumn(): ColumnConfig {
  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      const status = getDocStatus(doc) as InvoiceStatus;
      const color = statusColor[status] ?? 'gray';
      const label = getStatusText(status);

      return {
        template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
        metadata: {
          status,
          color,
          label,
        },
      };
    },
  };
}

export function getLeadStatusColumn(): ColumnConfig {
  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      const status = getLeadStatus(doc) as LeadStatus;
      const color = statusColor[status] ?? 'gray';
      const label = getStatusTextOfLead(status);

      return {
        template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
      };
    },
  };
}

export const statusColor: Record<
  DocStatus | InvoiceStatus | LeadStatus,
  string | undefined
> = {
  '': 'gray',
  Draft: 'gray',
  Open: 'gray',
  Replied: 'yellow',
  Opportunity: 'yellow',
  Unpaid: 'orange',
  Paid: 'green',
  PartlyPaid: 'yellow',
  Interested: 'yellow',
  Converted: 'green',
  Quotation: 'green',
  Saved: 'blue',
  NotSaved: 'gray',
  Submitted: 'green',
  Cancelled: 'red',
  DonotContact: 'red',
  Return: 'lime',
  ReturnIssued: 'lime',
};

export function getStatusText(status: DocStatus | InvoiceStatus): string {
  switch (status) {
    case 'Draft':
      return t`Draft`;
    case 'Saved':
      return t`Saved`;
    case 'NotSaved':
      return t`Not Saved`;
    case 'Submitted':
      return t`Submitted`;
    case 'Cancelled':
      return t`Cancelled`;
    case 'Paid':
      return t`Paid`;
    case 'Unpaid':
      return t`Unpaid`;
    case 'PartlyPaid':
      return t`Partly Paid`;
    case 'Return':
      return t`Return`;
    case 'ReturnIssued':
      return t`Return Issued`;
    default:
      return '';
  }
}

export function getStatusTextOfLead(status: LeadStatus): string {
  switch (status) {
    case 'Open':
      return t`Open`;
    case 'Replied':
      return t`Replied`;
    case 'Opportunity':
      return t`Opportunity`;
    case 'Interested':
      return t`Interested`;
    case 'Converted':
      return t`Converted`;
    case 'Quotation':
      return t`Quotation`;
    case 'DonotContact':
      return t`Do not Contact`;
    default:
      return '';
  }
}

export function getLeadStatus(
  doc?: Lead | Doc | RenderData
): LeadStatus | DocStatus {
  if (!doc) {
    return '';
  }

  return doc.status as LeadStatus;
}

export function getDocStatus(
  doc?: RenderData | Doc
): DocStatus | InvoiceStatus {
  if (!doc) {
    return '';
  }

  if (doc.notInserted) {
    return 'Draft';
  }

  if (doc.dirty) {
    return 'NotSaved';
  }

  if (!doc.schema?.isSubmittable) {
    return 'Saved';
  }

  return getSubmittableDocStatus(doc);
}

function getSubmittableDocStatus(doc: RenderData | Doc) {
  if (
    [ModelNameEnum.SalesInvoice, ModelNameEnum.PurchaseInvoice].includes(
      doc.schema.name as ModelNameEnum
    )
  ) {
    return getInvoiceStatus(doc);
  }

  if (
    [ModelNameEnum.Shipment, ModelNameEnum.PurchaseReceipt].includes(
      doc.schema.name as ModelNameEnum
    )
  ) {
    if (!!doc.returnAgainst && doc.submitted && !doc.cancelled) {
      return 'Return';
    }

    if (doc.isReturned && doc.submitted && !doc.cancelled) {
      return 'ReturnIssued';
    }
  }

  if (!!doc.submitted && !doc.cancelled) {
    return 'Submitted';
  }

  if (!!doc.submitted && !!doc.cancelled) {
    return 'Cancelled';
  }

  return 'Saved';
}

export function getInvoiceStatus(doc: RenderData | Doc): InvoiceStatus {
  if (doc.submitted && !doc.cancelled && doc.returnAgainst) {
    return 'Return';
  }

  if (doc.submitted && !doc.cancelled && doc.isReturned) {
    return 'ReturnIssued';
  }

  if (
    doc.submitted &&
    !doc.cancelled &&
    (doc.outstandingAmount as Money).isZero()
  ) {
    return 'Paid';
  }

  if (
    doc.submitted &&
    !doc.cancelled &&
    (doc.outstandingAmount as Money).eq(doc.grandTotal as Money)
  ) {
    return 'Unpaid';
  }

  if (doc.cancelled) {
    return 'Cancelled';
  }

  if (
    doc.submitted &&
    !doc.isCancelled &&
    (doc.outstandingAmount as Money).isPositive() &&
    (doc.outstandingAmount as Money).neq(doc.grandTotal as Money)
  ) {
    return 'PartlyPaid';
  }

  return 'Saved';
}

export function getSerialNumberStatusColumn(): ColumnConfig {
  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      let status = doc.status;
      if (typeof status !== 'string') {
        status = 'Inactive';
      }

      const color = serialNumberStatusColor[status] ?? 'gray';
      const label = getSerialNumberStatusText(status);

      return {
        template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
      };
    },
  };
}

export const serialNumberStatusColor: Record<string, string | undefined> = {
  Inactive: 'gray',
  Active: 'green',
  Delivered: 'blue',
};

export function getSerialNumberStatusText(status: string): string {
  switch (status) {
    case 'Inactive':
      return t`Inactive`;
    case 'Active':
      return t`Active`;
    case 'Delivered':
      return t`Delivered`;
    default:
      return t`Inactive`;
  }
}

export function getPriceListStatusColumn(): ColumnConfig {
  return {
    label: t`Enabled For`,
    fieldname: 'enabledFor',
    fieldtype: 'Select',
    render({ isSales, isPurchase }) {
      let status = t`None`;

      if (isSales && isPurchase) {
        status = t`Sales and Purchase`;
      } else if (isSales) {
        status = t`Sales`;
      } else if (isPurchase) {
        status = t`Purchase`;
      }

      return {
        template: `<Badge class="text-xs" color="gray">${status}</Badge>`,
      };
    },
  };
}

export function getIsDocEnabledColumn(): ColumnConfig {
  return {
    label: t`Enabled`,
    fieldname: 'enabled',
    fieldtype: 'Data',
    render(doc) {
      let status = t`Disabled`;
      let color = 'orange';
      if (doc.isEnabled) {
        status = t`Enabled`;
        color = 'green';
      }

      return {
        template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
      };
    },
  };
}

export async function getExchangeRate({
  fromCurrency,
  toCurrency,
  date,
}: {
  fromCurrency: string;
  toCurrency: string;
  date?: string;
}) {
  if (!fetch) {
    return 1;
  }

  if (!date) {
    date = DateTime.local().toISODate();
  }

  const cacheKey = `currencyExchangeRate:${date}:${fromCurrency}:${toCurrency}`;

  let exchangeRate = 0;
  if (localStorage) {
    exchangeRate = safeParseFloat(localStorage.getItem(cacheKey) as string);
  }

  if (exchangeRate && exchangeRate !== 1) {
    return exchangeRate;
  }

  try {
    const res = await fetch(
      `https://api.vatcomply.com/rates?date=${date}&base=${fromCurrency}&symbols=${toCurrency}`
    );
    const data = (await res.json()) as {
      base: string;
      data: string;
      rates: Record<string, number>;
    };
    exchangeRate = data.rates[toCurrency];
  } catch (error) {
    exchangeRate ??= 1;
  }

  if (localStorage) {
    localStorage.setItem(cacheKey, String(exchangeRate));
  }

  return exchangeRate;
}

export function isCredit(rootType: AccountRootType) {
  switch (rootType) {
    case AccountRootTypeEnum.Asset:
      return false;
    case AccountRootTypeEnum.Liability:
      return true;
    case AccountRootTypeEnum.Equity:
      return true;
    case AccountRootTypeEnum.Expense:
      return false;
    case AccountRootTypeEnum.Income:
      return true;
    default:
      return true;
  }
}

export function getNumberSeries(schemaName: string, fyo: Fyo) {
  const numberSeriesKey = numberSeriesDefaultsMap[schemaName];
  if (!numberSeriesKey) {
    return undefined;
  }

  const defaults = fyo.singles.Defaults;
  const field = fyo.getField(schemaName, 'numberSeries');
  const value = defaults?.[numberSeriesKey] as string | undefined;
  return value ?? (field?.default as string | undefined);
}

export function getDocStatusListColumn(): ColumnConfig {
  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      const status = getDocStatus(doc);
      const color = statusColor[status] ?? 'gray';
      const label = getStatusText(status);

      return {
        template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
        metadata: {
          status,
          color,
          label,
        },
      };
    },
  };
}

type ModelsWithItems = Invoice | StockTransfer | StockMovement;
export async function addItem<M extends ModelsWithItems>(name: string, doc: M) {
  if (!doc.canEdit) {
    return;
  }

  const items = (doc.items ?? []) as NonNullable<M['items']>[number][];

  let item = items.find((i) => i.item === name);
  if (item) {
    const q = item.quantity ?? 0;
    await item.set('quantity', q + 1);
    return;
  }

  await doc.append('items');
  item = doc.items?.at(-1);
  if (!item) {
    return;
  }

  await item.set('item', name);
}

export async function getReturnQtyTotal(
  doc: Invoice
): Promise<Record<string, number>> {
  const returnDocs = await doc.fyo.db.getAll(doc.schemaName, {
    fields: ['*'],
    filters: {
      returnAgainst: doc.name as string,
    },
  });

  const returnedDocs = await Promise.all(
    returnDocs.map((docss) =>
      doc.fyo.doc.getDoc(doc.schemaName, docss.name as string)
    )
  );

  const quantitySum: { [key: string]: number } = {};

  if ('items' in doc && Array.isArray(doc.items)) {
    doc.items.forEach((docItem) => {
      const itemName = docItem.item as string;
      if (itemName) {
        quantitySum[itemName] = (docItem.quantity as number) || 0;
      }
    });
  }

  if (!returnedDocs) {
    return quantitySum;
  }
  returnedDocs.forEach((returnedDoc) => {
    if (returnedDoc && returnedDoc.items) {
      (returnedDoc.items as InvoiceItem[]).forEach((item) => {
        const itemName = item.item;
        if (itemName && quantitySum.hasOwnProperty(itemName)) {
          quantitySum[itemName] =
            quantitySum[itemName] - Math.abs(item.quantity as number);
        }
      });
    }
  });
  return quantitySum;
}

export async function createLoyaltyPointEntry(doc: Invoice) {
  const loyaltyProgramDoc = (await doc.fyo.doc.getDoc(
    ModelNameEnum.LoyaltyProgram,
    doc?.loyaltyProgram
  )) as LoyaltyProgram;

  if (!loyaltyProgramDoc.isEnabled) {
    return;
  }
  const expiryDate = new Date(Date.now());

  expiryDate.setDate(
    expiryDate.getDate() + (loyaltyProgramDoc.expiryDuration || 0)
  );

  let loyaltyProgramTier;
  let loyaltyPoint: number;

  if (doc.redeemLoyaltyPoints) {
    loyaltyPoint = -(doc.loyaltyPoints || 0);
  } else {
    loyaltyProgramTier = getLoyaltyProgramTier(
      loyaltyProgramDoc,
      doc?.grandTotal as Money
    ) as CollectionRulesItems;

    if (!loyaltyProgramTier) {
      return;
    }

    const collectionFactor = loyaltyProgramTier.collectionFactor as number;
    loyaltyPoint = Math.round(doc?.grandTotal?.float || 0) * collectionFactor;
  }

  const newLoyaltyPointEntry = doc.fyo.doc.getNewDoc(
    ModelNameEnum.LoyaltyPointEntry,
    {
      loyaltyProgram: doc.loyaltyProgram,
      customer: doc.party,
      invoice: doc.name,
      postingDate: doc.date,
      purchaseAmount: doc.grandTotal,
      expiryDate: expiryDate,
      loyaltyProgramTier: loyaltyProgramTier?.tierName,
      loyaltyPoints: loyaltyPoint,
    }
  );

  return await newLoyaltyPointEntry.sync();
}

export async function getAddedLPWithGrandTotal(
  fyo: Fyo,
  loyaltyProgram: string,
  loyaltyPoints: number
) {
  const loyaltyProgramDoc = (await fyo.doc.getDoc(
    ModelNameEnum.LoyaltyProgram,
    loyaltyProgram
  )) as LoyaltyProgram;

  const conversionFactor = loyaltyProgramDoc.conversionFactor as number;

  return fyo.pesa((loyaltyPoints || 0) * conversionFactor);
}

export function getLoyaltyProgramTier(
  loyaltyProgramData: LoyaltyProgram,
  grandTotal: Money
): CollectionRulesItems | undefined {
  if (!loyaltyProgramData.collectionRules) {
    return;
  }

  let loyaltyProgramTier: CollectionRulesItems | undefined;

  for (const row of loyaltyProgramData.collectionRules) {
    if (isPesa(row.minimumTotalSpent)) {
      const minimumSpent = row.minimumTotalSpent;

      if (!minimumSpent.lte(grandTotal)) {
        continue;
      }

      if (
        !loyaltyProgramTier ||
        minimumSpent.gt(loyaltyProgramTier.minimumTotalSpent as Money)
      ) {
        loyaltyProgramTier = row;
      }
    }
  }
  return loyaltyProgramTier;
}

export async function removeLoyaltyPoint(doc: Doc) {
  if (!doc.loyaltyProgram) {
    return;
  }

  const data = (await doc.fyo.db.getAll(ModelNameEnum.LoyaltyPointEntry, {
    fields: ['name', 'loyaltyPoints', 'expiryDate'],
    filters: {
      loyaltyProgram: doc.loyaltyProgram as string,
      invoice: doc.isReturn
        ? (doc.returnAgainst as string)
        : (doc.name as string),
    },
  })) as { name: string; loyaltyPoints: number; expiryDate: Date }[];

  if (!data.length) {
    return;
  }

  const loyalityPointEntryDoc = await doc.fyo.doc.getDoc(
    ModelNameEnum.LoyaltyPointEntry,
    data[0].name
  );

  const party = (await doc.fyo.doc.getDoc(
    ModelNameEnum.Party,
    doc.party as string
  )) as Party;

  await loyalityPointEntryDoc.delete();
  await party.updateLoyaltyPoints();
}

export async function validateQty(
  sinvDoc: SalesInvoice,
  item: Item | SalesInvoiceItem | undefined,
  existingItems: InvoiceItem[]
) {
  if (!item) {
    return;
  }

  let itemName = item.name as string;
  const itemhasBatch = await sinvDoc.fyo.getValue(
    ModelNameEnum.Item,
    item.item as string,
    'hasBatch'
  );

  const itemQtyMap: ItemQtyMap = await getItemQtyMap(sinvDoc);

  if (item instanceof SalesInvoiceItem) {
    itemName = item.item as string;
  }

  if (itemhasBatch) {
    if (!item.batch) {
      throw new ValidationError(t`Please select a batch first`);
    }
  }

  const trackItem = await sinvDoc.fyo.getValue(
    ModelNameEnum.Item,
    item.item as string,
    'trackItem'
  );

  if (!trackItem) {
    return;
  }

  if (!itemQtyMap[itemName] || itemQtyMap[itemName].availableQty === 0) {
    throw new ValidationError(t`Item ${itemName} has Zero Quantity`);
  }

  if (item.batch) {
    if (
      (existingItems && !itemQtyMap[itemName]) ||
      itemQtyMap[itemName][item.batch as string] <
        (existingItems[0]?.quantity as number)
    ) {
      throw new ValidationError(
        t`Item ${itemName} only has ${
          itemQtyMap[itemName][item.batch as string]
        } Quantity in batch ${item.batch as string}`
      );
    }
  } else {
    if (
      (existingItems && !itemQtyMap[itemName]) ||
      itemQtyMap[itemName].availableQty < (existingItems[0]?.quantity as number)
    ) {
      throw new ValidationError(
        t`Item ${itemName} only has ${itemQtyMap[itemName].availableQty} Quantity`
      );
    }
  }

  return;
}

export async function getPricingRulesOfCoupons(
  doc: SalesInvoice,
  couponName?: string,
  pricingRuleDocNames?: string[]
): Promise<PricingRule[] | undefined> {
  if (!doc?.coupons?.length && !couponName) {
    return;
  }

  let appliedCoupons: CouponCode[] = [];

  const couponsToFetch = couponName
    ? [couponName]
    : (doc?.coupons?.map((coupon) => coupon.coupons) as string[] | []);

  if (couponsToFetch?.length) {
    appliedCoupons = (await doc.fyo.db.getAll(ModelNameEnum.CouponCode, {
      fields: ['*'],
      filters: { name: ['in', couponsToFetch] },
    })) as CouponCode[];
  }

  const filteredPricingRuleNames = appliedCoupons.filter(
    (val) => val.pricingRule === pricingRuleDocNames![0]
  );

  if (!filteredPricingRuleNames.length) {
    return;
  }

  const pricingRuleDocsForItem = (await doc.fyo.db.getAll(
    ModelNameEnum.PricingRule,
    {
      fields: ['*'],
      filters: {
        name: ['in', pricingRuleDocNames as string[]],
        isEnabled: true,
        isCouponCodeBased: true,
      },
      orderBy: 'priority',
      order: 'desc',
    }
  )) as PricingRule[];

  return pricingRuleDocsForItem;
}

export async function getPricingRule(
  doc: Invoice,
  couponName?: string
): Promise<ApplicablePricingRules[] | undefined> {
  if (
    !doc.fyo.singles.AccountingSettings?.enablePricingRule ||
    !doc.isSales ||
    !doc.items
  ) {
    return;
  }

  const pricingRules: ApplicablePricingRules[] = [];

  for (const item of doc.items) {
    if (item.isFreeItem) {
      continue;
    }

    const pricingRuleDocNames = (
      await doc.fyo.db.getAll(ModelNameEnum.PricingRuleItem, {
        fields: ['parent'],
        filters: {
          item: item.item as string,
          unit: item.unit as string,
        },
      })
    ).map((doc) => doc.parent) as string[];

    let pricingRuleDocsForItem;

    const pricingRuleDocs = (await doc.fyo.db.getAll(
      ModelNameEnum.PricingRule,
      {
        fields: ['*'],
        filters: {
          name: ['in', pricingRuleDocNames],
          isEnabled: true,
          isCouponCodeBased: false,
        },
        orderBy: 'priority',
        order: 'desc',
      }
    )) as PricingRule[];

    if (pricingRuleDocs.length) {
      pricingRuleDocsForItem = pricingRuleDocs;
    }

    if (!pricingRuleDocs.length || couponName) {
      const couponPricingRules: PricingRule[] | undefined =
        await getPricingRulesOfCoupons(
          doc as SalesInvoice,
          couponName,
          pricingRuleDocNames
        );

      pricingRuleDocsForItem = couponPricingRules as PricingRule[];
    }

    if (!pricingRuleDocsForItem) {
      continue;
    }

    const itemQuantity: Record<string, number> = {};

    for (const item of doc.items) {
      if (!item?.item) continue;

      if (!itemQuantity[item.item]) {
        itemQuantity[item.item] = item.quantity ?? 0;
      } else {
        itemQuantity[item.item] += item.quantity ?? 0;
      }
    }

    const filtered = filterPricingRules(
      doc as SalesInvoice,
      pricingRuleDocsForItem,
      itemQuantity[item.item as string],
      item.amount as Money
    );

    if (!filtered.length) {
      continue;
    }

    const isPricingRuleHasConflicts = getPricingRulesConflicts(filtered);

    if (isPricingRuleHasConflicts) {
      continue;
    }

    pricingRules.push({
      applyOnItem: item.item as string,
      pricingRule: filtered[0],
    });
  }

  return pricingRules;
}

export async function getItemRateFromPriceList(
  doc: InvoiceItem | SalesInvoiceItem,
  priceListName: string
): Promise<Money | undefined> {
  const item = doc.item;
  if (!priceListName || !item) {
    return;
  }

  const priceList = await doc.fyo.doc.getDoc(
    ModelNameEnum.PriceList,
    priceListName
  );

  if (!(priceList instanceof PriceList)) {
    return;
  }

  const unit = doc.unit;
  const transferUnit = doc.transferUnit;
  const plItem = priceList.priceListItem?.find((pli) => {
    if (pli.item !== item) {
      return false;
    }

    if (transferUnit && pli.unit !== transferUnit) {
      return false;
    } else if (unit && pli.unit !== unit) {
      return false;
    }

    return true;
  });

  return plItem?.rate;
}

export function filterPricingRules(
  doc: SalesInvoice,
  pricingRuleDocsForItem: PricingRule[],
  quantity: number,
  amount: Money
): PricingRule[] | [] {
  const filteredPricingRules: PricingRule[] = [];

  for (const pricingRuleDoc of pricingRuleDocsForItem) {
    if (
      canApplyPricingRule(pricingRuleDoc, doc.date as Date, quantity, amount)
    ) {
      filteredPricingRules.push(pricingRuleDoc);
    }
  }
  return filteredPricingRules;
}

export function canApplyPricingRule(
  pricingRuleDoc: PricingRule,
  sinvDate: Date,
  quantity: number,
  amount: Money
): boolean {
  if (
    (pricingRuleDoc.minQuantity as number) > 0 &&
    quantity < (pricingRuleDoc.minQuantity as number)
  ) {
    return false;
  }

  if (
    (pricingRuleDoc.maxQuantity as number) > 0 &&
    quantity > (pricingRuleDoc.maxQuantity as number)
  ) {
    return false;
  }

  // Filter by Amount
  if (
    !pricingRuleDoc.minAmount?.isZero() &&
    amount.lte(pricingRuleDoc.minAmount as Money)
  ) {
    return false;
  }

  if (
    !pricingRuleDoc.maxAmount?.isZero() &&
    amount.gte(pricingRuleDoc.maxAmount as Money)
  ) {
    return false;
  }

  // Filter by Validity
  if (sinvDate) {
    if (
      pricingRuleDoc.validFrom &&
      new Date(sinvDate).toISOString() < pricingRuleDoc.validFrom.toISOString()
    ) {
      return false;
    }

    if (
      pricingRuleDoc.validTo &&
      new Date(sinvDate).toISOString() > pricingRuleDoc.validTo.toISOString()
    ) {
      return false;
    }
  }

  return true;
}

export function canApplyCouponCode(
  couponCodeData: CouponCode,
  amount: Money,
  sinvDate: Date
): boolean {
  // Filter by Amount
  if (
    !couponCodeData.minAmount?.isZero() &&
    amount.lte(couponCodeData.minAmount as Money)
  ) {
    return false;
  }

  if (
    !couponCodeData.maxAmount?.isZero() &&
    amount.gte(couponCodeData.maxAmount as Money)
  ) {
    return false;
  }

  // Filter by Validity
  if (
    couponCodeData.validFrom &&
    new Date(sinvDate).toISOString() < couponCodeData.validFrom.toISOString()
  ) {
    return false;
  }

  if (
    couponCodeData.validTo &&
    new Date(sinvDate).toISOString() > couponCodeData.validTo.toISOString()
  ) {
    return false;
  }
  return true;
}
export async function removeUnusedCoupons(sinvDoc: SalesInvoice) {
  if (!sinvDoc.coupons?.length) {
    return;
  }

  const applicableCouponCodes = await Promise.all(
    sinvDoc.coupons?.map(async (coupon) => {
      return await getApplicableCouponCodesName(
        coupon.coupons as string,
        sinvDoc
      );
    })
  );

  const flattedApplicableCouponCodes = applicableCouponCodes?.flat();

  const couponCodeDoc = (await sinvDoc.fyo.doc.getDoc(
    ModelNameEnum.CouponCode,
    sinvDoc.coupons[0].coupons
  )) as CouponCode;

  couponCodeDoc.removeUnusedCoupons(
    flattedApplicableCouponCodes as ApplicableCouponCodes[],
    sinvDoc
  );
}

export async function getApplicableCouponCodesName(
  couponName: string,
  sinvDoc: SalesInvoice
) {
  const couponCodeDatas = (await sinvDoc.fyo.db.getAll(
    ModelNameEnum.CouponCode,
    {
      fields: ['*'],
      filters: {
        name: couponName,
        isEnabled: true,
      },
    }
  )) as CouponCode[];

  if (!couponCodeDatas || !couponCodeDatas.length) {
    return [];
  }

  const applicablePricingRules = await getPricingRule(sinvDoc, couponName);

  if (!applicablePricingRules?.length) {
    return [];
  }

  return applicablePricingRules
    ?.filter(
      (rule) => rule?.pricingRule?.name === couponCodeDatas[0].pricingRule
    )
    .map((rule) => ({
      pricingRule: rule.pricingRule.name,
      coupon: couponCodeDatas[0].name,
    }));
}

export async function validateCouponCode(
  doc: AppliedCouponCodes,
  value: string,
  sinvDoc?: SalesInvoice
) {
  const coupon = await doc.fyo.db.getAll(ModelNameEnum.CouponCode, {
    fields: [
      'minAmount',
      'maxAmount',
      'pricingRule',
      'validFrom',
      'validTo',
      'maximumUse',
      'used',
      'isEnabled',
    ],
    filters: { name: value },
  });

  if (!coupon[0]?.isEnabled) {
    throw new ValidationError(
      'Coupon code cannot be applied as it is not enabled'
    );
  }

  if ((coupon[0]?.maximumUse as number) <= (coupon[0]?.used as number)) {
    throw new ValidationError(
      'Coupon code has been used maximum number of times'
    );
  }

  if (!doc.parentdoc) {
    doc.parentdoc = sinvDoc;
  }

  const applicableCouponCodesNames = await getApplicableCouponCodesName(
    value,
    doc.parentdoc as SalesInvoice
  );

  if (!applicableCouponCodesNames?.length) {
    throw new ValidationError(
      t`Coupon ${value} is not applicable for applied items.`
    );
  }

  const couponExist = doc.parentdoc?.coupons?.some(
    (coupon) => coupon?.coupons === value
  );

  if (couponExist) {
    throw new ValidationError(t`${value} already applied.`);
  }

  if (
    (coupon[0].minAmount as Money).gte(doc.parentdoc?.grandTotal as Money) &&
    !(coupon[0].minAmount as Money).isZero()
  ) {
    throw new ValidationError(
      t`The Grand Total must exceed ${
        (coupon[0].minAmount as Money).float
      } to apply the coupon ${value}.`
    );
  }

  if (
    (coupon[0].maxAmount as Money).lte(doc.parentdoc?.grandTotal as Money) &&
    !(coupon[0].maxAmount as Money).isZero()
  ) {
    throw new ValidationError(
      t`The Grand Total must be less than ${
        (coupon[0].maxAmount as Money).float
      } to apply this coupon.`
    );
  }

  if ((coupon[0].validFrom as Date) > (doc.parentdoc?.date as Date)) {
    throw new ValidationError(
      t`Valid From Date should be less than Valid To Date.`
    );
  }

  if ((coupon[0].validTo as Date) < (doc.parentdoc?.date as Date)) {
    throw new ValidationError(
      t`Valid To Date should be greater than Valid From Date.`
    );
  }
}

export function removeFreeItems(sinvDoc: SalesInvoice) {
  if (!sinvDoc || !sinvDoc.items) {
    return;
  }

  if (!!sinvDoc.isPricingRuleApplied) {
    return;
  }

  for (const item of sinvDoc.items) {
    if (item.isFreeItem) {
      sinvDoc.items = sinvDoc.items?.filter(
        (invoiceItem) => invoiceItem.name !== item.name
      );
    }
  }
}

export async function updatePricingRule(sinvDoc: SalesInvoice) {
  const applicablePricingRuleNames = await getPricingRule(sinvDoc);

  if (!applicablePricingRuleNames || !applicablePricingRuleNames.length) {
    sinvDoc.pricingRuleDetail = undefined;
    sinvDoc.isPricingRuleApplied = false;
    removeFreeItems(sinvDoc);
    return;
  }

  const appliedPricingRuleCount = sinvDoc?.items?.filter(
    (val) => val.isFreeItem
  ).length;

  setTimeout(() => {
    void (async () => {
      if (appliedPricingRuleCount !== applicablePricingRuleNames?.length) {
        await sinvDoc.appendPricingRuleDetail(applicablePricingRuleNames);
        await sinvDoc.applyProductDiscount();
      }
    })();
  }, 1);
}

export function getPricingRulesConflicts(
  pricingRules: PricingRule[]
): undefined | boolean {
  const pricingRuleDocs = Array.from(pricingRules);

  const firstPricingRule = pricingRuleDocs.shift();
  if (!firstPricingRule) {
    return;
  }

  const conflictingPricingRuleNames: string[] = [];
  for (const pricingRuleDoc of pricingRuleDocs.slice(0)) {
    if (pricingRuleDoc.priority !== firstPricingRule?.priority) {
      continue;
    }

    conflictingPricingRuleNames.push(pricingRuleDoc.name as string);
  }

  if (!conflictingPricingRuleNames.length) {
    return;
  }

  return true;
}

export function roundFreeItemQty(
  quantity: number,
  roundingMethod: 'round' | 'floor' | 'ceil'
): number {
  return Math[roundingMethod](quantity);
}
