export interface KmdBodyTotals {

transactions24: number;

transactions20: number;

transactions22: number;

transactions9: number;

transactions5: number;

transactions13: number;

transactionsZeroVat: number;

euSupplyInclGoodsAndServicesZeroVat: number;

euSupplyGoodsZeroVat: number;

exportZeroVat: number;

inputVatTotal: number;

euAcquisitionsGoodsAndServicesTotal: number;

euAcquisitionsGoods: number;

acquisitionOtherGoodsAndServicesTotal: number;

supplyExemptFromTax: number;

adjustmentsPlus: number;

adjustmentsMinus: number;
}

export interface SaleAnnexLine {
  buyerRegCode?: string;
  buyerName?: string;
  invoiceNumber?: string;

invoiceDate?: string;

invoiceSum: number;

taxRate: string;
}

export interface PurchaseAnnexLine {
  sellerRegCode?: string;
  sellerName?: string;
  invoiceNumber?: string;

invoiceDate?: string;

invoiceSumVat: number;

vatInPeriod: number;
}

export interface KmdReportData {
  taxPayerRegCode: string;
  year: number;

month: number;

version: string;

declarationType: 1 | 2;
  body: KmdBodyTotals;
  saleAnnex: SaleAnnexLine[];
  purchaseAnnex: PurchaseAnnexLine[];
}
