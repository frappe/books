import { VatCodeName } from 'regional/ee';

export interface BankRow {
  accountIban: string;
  documentNumber?: string;
  date: string;
  counterpartyIban?: string;
  counterpartyName?: string;
  amount: number;
  currency: string;
  remittance?: string;
  referenceNumber?: string;
  archivalId: string;
  bic?: string;
}

export type ClassifiedSide = 'sales' | 'purchase' | 'fee' | 'transfer' | 'unknown';

export interface ClassifiedRow extends BankRow {
  proposedVatCode: VatCodeName | null;
  proposedAccount: string;
  side: ClassifiedSide;
  matchedRuleId?: string;
  isDuplicate?: boolean;
}

export interface ClassifierRule {
  id: string;
  match: {
    counterpartyIban?: string;
    counterpartyNameContains?: string;
    remittanceContains?: string;
    sign?: 'debit' | 'credit';
  };
  account: string;
  vatCode: VatCodeName | null;
  side: ClassifiedSide;
}

export interface EeBank {
  id: string;
  label: string;
  csvSupported: boolean;
}

export const EE_BANKS: EeBank[] = [
  { id: 'lhv', label: 'LHV', csvSupported: true },
  { id: 'seb', label: 'SEB', csvSupported: false },
  { id: 'swedbank', label: 'Swedbank', csvSupported: false },
  { id: 'luminor', label: 'Luminor', csvSupported: false },
  { id: 'coop', label: 'Coop Pank', csvSupported: false },
];
