import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action, ColumnConfig, DocStatus, RenderData } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { Money } from 'pesa';
import { safeParseFloat } from 'utils/index';
import { Router } from 'vue-router';
import {
  AccountRootType,
  AccountRootTypeEnum,
} from './baseModels/Account/types';
import { numberSeriesDefaultsMap } from './baseModels/Defaults/Defaults';
import { Invoice } from './baseModels/Invoice/Invoice';
import { StockMovement } from './inventory/StockMovement';
import { StockTransfer } from './inventory/StockTransfer';
import { InvoiceStatus, ModelNameEnum } from './types';

export function getInvoiceActions(
  fyo: Fyo,
  schemaName: ModelNameEnum.SalesInvoice | ModelNameEnum.PurchaseInvoice
): Action[] {
  return [
    getMakePaymentAction(fyo),
    getMakeStockTransferAction(fyo, schemaName),
    getLedgerLinkAction(fyo),
  ];
}

export function getStockTransferActions(
  fyo: Fyo,
  schemaName: ModelNameEnum.Shipment | ModelNameEnum.PurchaseReceipt
): Action[] {
  return [
    getMakeInvoiceAction(fyo, schemaName),
    getLedgerLinkAction(fyo, false),
    getLedgerLinkAction(fyo, true),
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
  schemaName: ModelNameEnum.Shipment | ModelNameEnum.PurchaseReceipt
): Action {
  let label = fyo.t`Sales Invoice`;
  if (schemaName === ModelNameEnum.PurchaseReceipt) {
    label = fyo.t`Purchase Invoice`;
  }

  return {
    label,
    group: fyo.t`Create`,
    condition: (doc: Doc) => doc.isSubmitted && !doc.backReference,
    action: async (doc: Doc) => {
      const invoice = await (doc as StockTransfer).getInvoice();
      if (!invoice || !invoice.name) {
        return;
      }

      const { routeTo } = await import('src/utils/ui');
      const path = `/edit/${invoice.schemaName}/${invoice.name}`;
      await routeTo(path);
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
      const payment = (doc as Invoice).getPayment();
      if (!payment) {
        return;
      }

      const currentRoute = router.currentRoute.value.fullPath;
      payment.once('afterSync', async () => {
        await payment.submit();
        await doc.load();
        await router.push(currentRoute);
      });

      const hideFields = ['party', 'paymentType', 'for'];
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
      };
    },
  };
}

export const statusColor: Record<
  DocStatus | InvoiceStatus,
  string | undefined
> = {
  '': 'gray',
  Draft: 'gray',
  Unpaid: 'orange',
  Paid: 'green',
  Saved: 'gray',
  NotSaved: 'gray',
  Submitted: 'green',
  Cancelled: 'red',
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
    default:
      return '';
  }
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

  if (!!doc.submitted && !doc.cancelled) {
    return 'Submitted';
  }

  if (!!doc.submitted && !!doc.cancelled) {
    return 'Cancelled';
  }

  return 'Saved';
}

export function getInvoiceStatus(doc: RenderData | Doc): InvoiceStatus {
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
    (doc.outstandingAmount as Money).isPositive()
  ) {
    return 'Unpaid';
  }

  if (doc.cancelled) {
    return 'Cancelled';
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

export function getPriceListEnabledColumn(): ColumnConfig {
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
    // eslint-disable-next-line no-console
    console.error(error);
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
