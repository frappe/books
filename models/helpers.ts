import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action, ColumnConfig, DocStatus, RenderData } from 'fyo/model/types';
import { NotFoundError } from 'fyo/utils/errors';
import { DateTime } from 'luxon';
import { Money } from 'pesa';
import { Router } from 'vue-router';
import {
  AccountRootType,
  AccountRootTypeEnum,
} from './baseModels/Account/types';
import { InvoiceStatus, ModelNameEnum } from './types';

export function getInvoiceActions(
  schemaName: ModelNameEnum.PurchaseInvoice | ModelNameEnum.SalesInvoice,
  fyo: Fyo
): Action[] {
  return [
    {
      label: fyo.t`Make Payment`,
      condition: (doc: Doc) =>
        doc.isSubmitted && !(doc.outstandingAmount as Money).isZero(),
      action: async function makePayment(doc: Doc) {
        const payment = fyo.doc.getNewDoc('Payment');
        payment.once('afterSync', async () => {
          await payment.submit();
        });

        const isSales = schemaName === 'SalesInvoice';
        const party = doc.party as string;
        const paymentType = isSales ? 'Receive' : 'Pay';
        const hideAccountField = isSales ? 'account' : 'paymentAccount';

        const { openQuickEdit } = await import('src/utils/ui');
        await openQuickEdit({
          schemaName: 'Payment',
          name: payment.name as string,
          hideFields: ['party', 'date', hideAccountField, 'paymentType', 'for'],
          defaults: {
            party,
            [hideAccountField]: doc.account,
            date: new Date().toISOString().slice(0, 10),
            paymentType,
            for: [
              {
                referenceType: doc.schemaName,
                referenceName: doc.name,
                amount: doc.outstandingAmount,
              },
            ],
          },
        });
      },
    },
    getLedgerLinkAction(fyo),
  ];
}

export function getLedgerLinkAction(fyo: Fyo): Action {
  return {
    label: fyo.t`Ledger Entries`,
    condition: (doc: Doc) => doc.isSubmitted,
    action: async (doc: Doc, router: Router) => {
      router.push({
        name: 'Report',
        params: {
          reportClassName: 'GeneralLedger',
          defaultFilters: JSON.stringify({
            referenceType: doc.schemaName,
            referenceName: doc.name,
          }),
        },
      });
    },
  };
}

export function getTransactionStatusColumn(): ColumnConfig {
  const statusMap = getStatusMap();

  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc) {
      const status = getDocStatus(doc) as InvoiceStatus;
      const color = statusColor[status];
      const label = statusMap[status];

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

export function getStatusMap(): Record<DocStatus | InvoiceStatus, string> {
  return {
    '': '',
    Draft: t`Draft`,
    Unpaid: t`Unpaid`,
    Paid: t`Paid`,
    Saved: t`Saved`,
    NotSaved: t`Not Saved`,
    Submitted: t`Submitted`,
    Cancelled: t`Cancelled`,
  };
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

export async function getExchangeRate({
  fromCurrency,
  toCurrency,
  date,
}: {
  fromCurrency: string;
  toCurrency: string;
  date?: string;
}) {
  if (!date) {
    date = DateTime.local().toISODate();
  }

  if (!fromCurrency || !toCurrency) {
    throw new NotFoundError(
      'Please provide `fromCurrency` and `toCurrency` to get exchange rate.'
    );
  }

  const cacheKey = `currencyExchangeRate:${date}:${fromCurrency}:${toCurrency}`;

  let exchangeRate = 0;
  if (localStorage) {
    exchangeRate = parseFloat(
      localStorage.getItem(cacheKey as string) as string
    );
  }

  if (!exchangeRate && fetch) {
    try {
      const res = await fetch(
        ` https://api.vatcomply.com/rates?date=${date}&base=${fromCurrency}&symbols=${toCurrency}`
      );
      const data = await res.json();
      exchangeRate = data.rates[toCurrency];

      if (localStorage) {
        localStorage.setItem(cacheKey, String(exchangeRate));
      }
    } catch (error) {
      console.error(error);
      throw new NotFoundError(
        `Could not fetch exchange rate for ${fromCurrency} -> ${toCurrency}`,
        false
      );
    }
  } else {
    exchangeRate = 1;
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
