/**
 * Estonian regional static lookups.
 *
 * VAT codes drive KMD line aggregation (see plan.md §4.5).
 * County map mirrors regional/in.ts state-code pattern.
 */

export type VatCodeName =
  | 'EE24'
  | 'EE13'
  | 'EE9'
  | 'EE0'
  | 'EU_RC_GOODS'
  | 'EU_RC_SERVICES'
  | 'NON_EU_RC'
  | 'ZERO_EU_B2B'
  | 'ZERO_EXPORT'
  | 'EXEMPT';

export interface VatCodeSpec {
  rate: number;
  reverseCharge: boolean;
  description: string;
}

export const VAT_CODES: Record<VatCodeName, VatCodeSpec> = {
  EE24: {
    rate: 24,
    reverseCharge: false,
    description: 'Estonian standard rate 24%',
  },
  EE13: {
    rate: 13,
    reverseCharge: false,
    description: 'Estonian reduced rate 13% (accommodation)',
  },
  EE9: {
    rate: 9,
    reverseCharge: false,
    description: 'Estonian reduced rate 9% (books, medicines)',
  },
  EE0: { rate: 0, reverseCharge: false, description: 'Estonian zero-rated' },
  EU_RC_GOODS: {
    rate: 24,
    reverseCharge: true,
    description: 'EU acquisition of goods (reverse charge)',
  },
  EU_RC_SERVICES: {
    rate: 24,
    reverseCharge: true,
    description: 'EU service import (reverse charge)',
  },
  NON_EU_RC: {
    rate: 24,
    reverseCharge: true,
    description: 'Non-EU service import (reverse charge)',
  },
  ZERO_EU_B2B: {
    rate: 0,
    reverseCharge: false,
    description: 'EU B2B sale (zero-rated, buyer self-assesses)',
  },
  ZERO_EXPORT: {
    rate: 0,
    reverseCharge: false,
    description: 'Export outside EU (zero-rated)',
  },
  EXEMPT: { rate: 0, reverseCharge: false, description: 'VAT exempt' },
};

export const EE_COUNTIES = [
  'Harju',
  'Hiiu',
  'Ida-Viru',
  'Jõgeva',
  'Järva',
  'Lääne',
  'Lääne-Viru',
  'Põlva',
  'Pärnu',
  'Rapla',
  'Saare',
  'Tartu',
  'Valga',
  'Viljandi',
  'Võru',
] as const;

export type EeCounty = typeof EE_COUNTIES[number];

export const EE_VAT_NUMBER_RE = /^EE\d{9}$/;
export const EE_REGISTRY_CODE_RE = /^\d{8}$/;
