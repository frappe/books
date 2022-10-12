import { Doc } from 'fyo/model/doc';
import { FiltersMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export class Defaults extends Doc {
  salesInvoiceNumberSeries?: string;
  purchaseInvoiceNumberSeries?: string;
  journalEntryNumberSeries?: string;
  paymentNumberSeries?: string;

  salesInvoiceTerms?: string;
  purchaseInvoiceTerms?: string;

  static filters: FiltersMap = {
    salesInvoiceNumberSeries: () => ({
      referenceType: ModelNameEnum.SalesInvoice,
    }),
    purchaseInvoiceNumberSeries: () => ({
      referenceType: ModelNameEnum.PurchaseInvoice,
    }),
    journalEntryNumberSeries: () => ({
      referenceType: ModelNameEnum.JournalEntry,
    }),
    paymentNumberSeries: () => ({ referenceType: ModelNameEnum.Payment }),
  };

  static createFilters: FiltersMap = {
    salesInvoiceNumberSeries: () => ({
      referenceType: ModelNameEnum.SalesInvoice,
    }),
    purchaseInvoiceNumberSeries: () => ({
      referenceType: ModelNameEnum.PurchaseInvoice,
    }),
    journalEntryNumberSeries: () => ({
      referenceType: ModelNameEnum.JournalEntry,
    }),
    paymentNumberSeries: () => ({
      referenceType: ModelNameEnum.Payment,
    }),
  };
}

export const numberSeriesDefaultsMap: Record<
  string,
  keyof Defaults | undefined
> = {
  [ModelNameEnum.SalesInvoice]: 'salesInvoiceNumberSeries',
  [ModelNameEnum.PurchaseInvoice]: 'purchaseInvoiceNumberSeries',
  [ModelNameEnum.JournalEntry]: 'journalEntryNumberSeries',
  [ModelNameEnum.Payment]: 'paymentNumberSeries',
};
