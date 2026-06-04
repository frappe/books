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
  salePassengersWithReturnVat: number;
  inputVatTotal: number;
  importVat: number;
  fixedAssetsVat: number;
  carsVat: number;
  numberOfCars: number;
  carsPartialVat: number;
  numberOfCarsPartial: number;
  euAcquisitionsGoodsAndServicesTotal: number;
  euAcquisitionsGoods: number;
  acquisitionOtherGoodsAndServicesTotal: number;
  acquisitionImmovablesAndScrapMetalAndGold: number;
  supplyExemptFromTax: number;
  supplySpecialArrangements: number;
  adjustmentsPlus: number;
  adjustmentsMinus: number;
  rcVatPayable: number;
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

export interface VdLine {
  partnerCountry: string;
  partnerVatCode: string;
  goods: number;
  triangle: number;
  services: number;
}

export interface VdReportData {
  taxPayerRegCode: string;
  year: number;
  month: number;
  lines: VdLine[];
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
