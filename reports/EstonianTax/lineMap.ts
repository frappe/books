import { VatCodeName } from 'regional/ee';
import { KmdBodyTotals } from './types';

export type KmdSide = 'sales' | 'purchase' | 'rc-sales' | 'rc-purchase';

export interface VatCodeBucket {
  primary: keyof KmdBodyTotals;

  also?: (keyof KmdBodyTotals)[];
  side: KmdSide;

  rate: number;
}

export const VAT_CODE_TO_BUCKET: Record<VatCodeName, VatCodeBucket | null> = {
  EE24: { primary: 'transactions24', side: 'sales', rate: 24 },
  EE13: { primary: 'transactions13', side: 'sales', rate: 13 },
  EE9: { primary: 'transactions9', side: 'sales', rate: 9 },
  EE0: { primary: 'transactionsZeroVat', side: 'sales', rate: 0 },
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

export function pickVersion(year: number, month: number): string {
  const ym = year * 100 + month;
  if (ym >= 202507) return 'KMD6';
  if (ym >= 202501) return 'KMD5';
  if (ym >= 202401) return 'KMD4';
  return 'KMD4';
}
