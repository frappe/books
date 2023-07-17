import { Doc } from 'fyo/model/doc';
import { FiltersMap, HiddenMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export class Defaults extends Doc {
  // Auto Payments
  salesPaymentAccount?: string;
  purchasePaymentAccount?: string;

  // Auto Stock Transfer
  shipmentLocation?: string;
  purchaseReceiptLocation?: string;

  // Number Series
  salesInvoiceNumberSeries?: string;
  purchaseInvoiceNumberSeries?: string;
  journalEntryNumberSeries?: string;
  paymentNumberSeries?: string;
  stockMovementNumberSeries?: string;
  shipmentNumberSeries?: string;
  purchaseReceiptNumberSeries?: string;

  // Terms
  salesInvoiceTerms?: string;
  purchaseInvoiceTerms?: string;
  shipmentTerms?: string;
  purchaseReceiptTerms?: string;

  // Print Templates
  salesInvoicePrintTemplate?: string;
  purchaseInvoicePrintTemplate?: string;
  journalEntryPrintTemplate?: string;
  paymentPrintTemplate?: string;
  shipmentPrintTemplate?: string;
  purchaseReceiptPrintTemplate?: string;
  stockMovementPrintTemplate?: string;

  // Point of Sale
  posCustomer?: string;
  posPrintTemplate?: string;

  static commonFilters = {
    // Auto Payments
    salesPaymentAccount: () => ({ isGroup: false, accountType: 'Cash' }),
    purchasePaymentAccount: () => ({ isGroup: false, accountType: 'Cash' }),
    // Number Series
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
    // Print Templates
    salesInvoicePrintTemplate: () => ({ type: ModelNameEnum.SalesInvoice }),
    purchaseInvoicePrintTemplate: () => ({
      type: ModelNameEnum.PurchaseInvoice,
    }),
    journalEntryPrintTemplate: () => ({ type: ModelNameEnum.JournalEntry }),
    paymentPrintTemplate: () => ({ type: ModelNameEnum.Payment }),
    shipmentPrintTemplate: () => ({ type: ModelNameEnum.Shipment }),
    purchaseReceiptPrintTemplate: () => ({
      type: ModelNameEnum.PurchaseReceipt,
    }),
    stockMovementPrintTemplate: () => ({ type: ModelNameEnum.StockMovement }),
    // Point of Sale
    posCustomer: () => ({
      role: ['in', ['Customer', 'Both']],
    }),
    posPrintTemplate: () => ({
      type: ModelNameEnum.SalesInvoice,
    }),
  };

  static filters: FiltersMap = this.commonFilters;
  static createFilters: FiltersMap = this.commonFilters;

  getInventoryHidden() {
    return () => !this.fyo.singles.AccountingSettings?.enableInventory;
  }

  getPOSHidden() {
    return () => !this.fyo.singles.AccountingSettings?.enableInventory;
  }

  hidden: HiddenMap = {
    stockMovementNumberSeries: this.getInventoryHidden(),
    shipmentNumberSeries: this.getInventoryHidden(),
    purchaseReceiptNumberSeries: this.getInventoryHidden(),
    shipmentTerms: this.getInventoryHidden(),
    purchaseReceiptTerms: this.getInventoryHidden(),
    shipmentPrintTemplate: this.getInventoryHidden(),
    purchaseReceiptPrintTemplate: this.getInventoryHidden(),
    stockMovementPrintTemplate: this.getInventoryHidden(),
    // Point of Sale
    posCustomer: this.getPOSHidden(),
    posInventory: this.getPOSHidden(),
    posPrintTemplate: this.getPOSHidden(),
    posAdjustmentAccount: this.getPOSHidden(),
    posCashDenominations: this.getPOSHidden(),
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
