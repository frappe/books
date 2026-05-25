import { VatCodeName } from 'regional/ee';
import { KmdBodyTotals } from './types';

/**
 * For each VAT code, the element name it contributes to in `declarationBody`.
 *
 * Returned `field` is the field name; the value to add is the row's net
 * amount (absolute value of the bank-leg, not the VAT amount — output VAT is
 * computed by the portal from the rate-bucket totals).
 *
 * `side: 'sales' | 'purchase'` distinguishes the leg in case the line
 * aggregator needs to handle reverse-charge differently (RC net goes into
 * line 6, RC self-assessed VAT goes into line 5 via the input-VAT calculation).
 */
export type KmdSide = 'sales' | 'purchase' | 'rc-sales' | 'rc-purchase';

export interface VatCodeBucket {
  /** Primary line (always populated). */
  primary: keyof KmdBodyTotals;
  /** Optional subtotal lines (e.g. EU goods is also part of EU supply total). */
  also?: (keyof KmdBodyTotals)[];
  side: KmdSide;
  /** Rate used to compute self-assessed VAT for reverse-charge codes. */
  rate: number;
}

export const VAT_CODE_TO_BUCKET: Record<VatCodeName, VatCodeBucket | null> = {
  // Domestic sales
  EE24: { primary: 'transactions24', side: 'sales', rate: 24 },
  EE13: { primary: 'transactions13', side: 'sales', rate: 13 },
  EE9: { primary: 'transactions9', side: 'sales', rate: 9 },
  EE0: { primary: 'transactionsZeroVat', side: 'sales', rate: 0 },

  // Zero-rated exports / EU B2B (sales side, line 3 + subtotals)
  ZERO_EU_B2B: {
    primary: 'transactionsZeroVat',
    also: ['euSupplyInclGoodsAndServicesZeroVat'],
    side: 'sales',
    rate: 0,
  },
  ZERO_EXPORT: {
    primary: 'transactionsZeroVat',
    also: ['exportZeroVat'],
    side: 'sales',
    rate: 0,
  },

  // Reverse-charge acquisitions (line 6 net; self-assessed VAT into line 5)
  EU_RC_GOODS: {
    primary: 'euAcquisitionsGoodsAndServicesTotal',
    also: ['euAcquisitionsGoods'],
    side: 'rc-purchase',
    rate: 24,
  },
  EU_RC_SERVICES: {
    primary: 'euAcquisitionsGoodsAndServicesTotal',
    side: 'rc-purchase',
    rate: 24,
  },
  NON_EU_RC: {
    primary: 'acquisitionOtherGoodsAndServicesTotal',
    side: 'rc-purchase',
    rate: 24,
  },

  // Exempt — line 8 from sales side only; purchases drop off
  EXEMPT: { primary: 'supplyExemptFromTax', side: 'sales', rate: 0 },
};

export function emptyKmdBody(): KmdBodyTotals {
  return {
    transactions24: 0,
    transactions20: 0,
    transactions22: 0,
    transactions9: 0,
    transactions5: 0,
    transactions13: 0,
    transactionsZeroVat: 0,
    euSupplyInclGoodsAndServicesZeroVat: 0,
    euSupplyGoodsZeroVat: 0,
    exportZeroVat: 0,
    inputVatTotal: 0,
    euAcquisitionsGoodsAndServicesTotal: 0,
    euAcquisitionsGoods: 0,
    acquisitionOtherGoodsAndServicesTotal: 0,
    supplyExemptFromTax: 0,
    adjustmentsPlus: 0,
    adjustmentsMinus: 0,
  };
}

/**
 * Pick the schema version string for a (year, month) period.
 *
 * Per XSD: KMD4 = 01.2024–12.2024, KMD5 = 01.2025–06.2025, KMD6 = ≥ 07.2025.
 */
export function pickVersion(year: number, month: number): string {
  const ym = year * 100 + month;
  if (ym >= 202507) return 'KMD6';
  if (ym >= 202501) return 'KMD5';
  if (ym >= 202401) return 'KMD4';
  return 'KMD4';
}
