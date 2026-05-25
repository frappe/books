import { VatCodeName } from 'regional/ee';

export interface LhvRow {

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

export interface ClassifiedRow extends LhvRow {
  proposedVatCode: VatCodeName | null;
  proposedAccount: string;
  side: ClassifiedSide;
  matchedRuleId?: string;
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
