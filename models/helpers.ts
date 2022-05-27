import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Action, ColumnConfig } from 'fyo/model/types';
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
  const statusMap = {
    Unpaid: t`Unpaid`,
    Paid: t`Paid`,
    Draft: t`Draft`,
    Cancelled: t`Cancelled`,
  };

  return {
    label: t`Status`,
    fieldname: 'status',
    fieldtype: 'Select',
    render(doc: Doc) {
      const status = getInvoiceStatus(doc) as InvoiceStatus;
      const color = statusColor[status];
      const label = statusMap[status];
      return {
        template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
      };
    },
  };
}

export const statusColor = {
  Draft: 'gray',
  Unpaid: 'orange',
  Paid: 'green',
  Cancelled: 'red',
};

export function getInvoiceStatus(doc: Doc) {
  let status = 'Unpaid';
  if (!doc.submitted) {
    status = 'Draft';
  }

  if (doc.submitted && (doc.outstandingAmount as Money).isZero()) {
    status = 'Paid';
  }

  if (doc.cancelled) {
    status = 'Cancelled';
  }
  return status;
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
      throw new Error(
        `Could not fetch exchange rate for ${fromCurrency} -> ${toCurrency}`
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
