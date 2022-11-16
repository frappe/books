import { Doc } from 'fyo/model/doc';
import { FiltersMap, HiddenMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export class Defaults extends Doc {
  salesInvoiceNumberSeries?: string;
  purchaseInvoiceNumberSeries?: string;
  journalEntryNumberSeries?: string;
  paymentNumberSeries?: string;
  stockMovementNumberSeries?: string;
  shipmentNumberSeries?: string;
  purchaseReceiptNumberSeries?: string;

  salesInvoiceTerms?: string;
  purchaseInvoiceTerms?: string;
  shipmentTerms?: string;
  purchaseReceiptTerms?: string;

  static commonFilters = {
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
    stockMovementNumberSeries: () => ({
      referenceType: ModelNameEnum.StockMovement,
    }),
    shipmentNumberSeries: () => ({
      referenceType: ModelNameEnum.Shipment,
    }),
    purchaseReceiptNumberSeries: () => ({
      referenceType: ModelNameEnum.PurchaseReceipt,
    }),
  };

  static filters: FiltersMap = this.commonFilters;
  static createFilters: FiltersMap = this.commonFilters;

  hideInventoryDefaults(): boolean {
    return !this.fyo.store.appFlags.getIsInventoryEnabled;
  }

  hidden: HiddenMap = {
    stockMovementNumberSeries: this.hideInventoryDefaults.bind(this),
    shipmentNumberSeries: this.hideInventoryDefaults.bind(this),
    purchaseReceiptNumberSeries: this.hideInventoryDefaults.bind(this),
    shipmentTerms: this.hideInventoryDefaults.bind(this),
    purchaseReceiptTerms: this.hideInventoryDefaults.bind(this),
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
  [ModelNameEnum.StockMovement]: 'stockMovementNumberSeries',
  [ModelNameEnum.Shipment]: 'shipmentNumberSeries',
  [ModelNameEnum.PurchaseReceipt]: 'purchaseReceiptNumberSeries',
};
