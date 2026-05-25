/**
 * KMD declarationBody fields, keyed by line number string as used in the
 * EMTA spec. Element names match `vatdeclaration.xsd` (DeclarationBody type).
 *
 * Output VAT (line 4) and net VAT payable (line 12) are NOT in the schema —
 * the portal computes them server-side from rate-bucket totals.
 */
export interface KmdBodyTotals {
  /** Line 1 — 24% taxable supplies (net). Valid from 2025-07. */
  transactions24: number;
  /** Line 1¹ — 20% legacy (mostly zero from 2024). */
  transactions20: number;
  /** Line 1² — 22% legacy (07.2024–06.2025), still possible for credit notes. */
  transactions22: number;
  /** Line 2 — 9% reduced. */
  transactions9: number;
  /** Line 2¹ — 5% reduced. */
  transactions5: number;
  /** Line 2² — 13% accommodation. */
  transactions13: number;
  /** Line 3 — total 0%-rated sales. */
  transactionsZeroVat: number;
  /** Line 3.1 — EU B2B supplies (subset of line 3). */
  euSupplyInclGoodsAndServicesZeroVat: number;
  /** Line 3.1.1 — EU goods only (subset of 3.1). */
  euSupplyGoodsZeroVat: number;
  /** Line 3.2 — exports outside EU (subset of 3). */
  exportZeroVat: number;
  /** Line 5 — input VAT total (deductible). */
  inputVatTotal: number;
  /** Line 6 — EU acquisitions + reverse-charge services. */
  euAcquisitionsGoodsAndServicesTotal: number;
  /** Line 6.1 — EU goods acquisitions only (subset of 6). */
  euAcquisitionsGoods: number;
  /** Line 7 — other purchases subject to VAT (non-RC). */
  acquisitionOtherGoodsAndServicesTotal: number;
  /** Line 8 — VAT-exempt supplies. */
  supplyExemptFromTax: number;
  /** Line 10 — adjustments (+). */
  adjustmentsPlus: number;
  /** Line 11 — adjustments (-). */
  adjustmentsMinus: number;
}

export interface SaleAnnexLine {
  buyerRegCode?: string;
  buyerName?: string;
  invoiceNumber?: string;
  /** ISO yyyy-mm-dd. */
  invoiceDate?: string;
  /** Excludes VAT. */
  invoiceSum: number;
  /** Tax rate classifier (TAX_RATE_SALES): e.g. "24", "13", "9", "5", "0", "20", "22". */
  taxRate: string;
}

export interface PurchaseAnnexLine {
  sellerRegCode?: string;
  sellerName?: string;
  invoiceNumber?: string;
  /** ISO yyyy-mm-dd. */
  invoiceDate?: string;
  /** Includes VAT. */
  invoiceSumVat: number;
  /** Input VAT declared this period (line 5 of KMD). */
  vatInPeriod: number;
}

export interface KmdReportData {
  taxPayerRegCode: string;
  year: number;
  /** 1–12. */
  month: number;
  /** Always "KMD6" for periods ≥ 07.2025; spec auto-version. */
  version: string;
  /** 1 = normal period, 2 = bankruptcy. */
  declarationType: 1 | 2;
  body: KmdBodyTotals;
  saleAnnex: SaleAnnexLine[];
  purchaseAnnex: PurchaseAnnexLine[];
}
