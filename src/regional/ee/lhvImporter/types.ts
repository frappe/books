import { VatCodeName } from 'regional/ee';

/**
 * Normalized bank-statement row. Both CSV and CAMT.053 parsers produce this shape.
 */
export interface LhvRow {
  /** Account IBAN of the company (column 1 in CSV; `Stmt.Acct.Id.IBAN` in CAMT). */
  accountIban: string;
  /** Bank-side document number (LHV CSV col 2). May be empty for CAMT-only rows. */
  documentNumber?: string;
  /** Booking date in ISO 8601 (YYYY-MM-DD). */
  date: string;
  /** Counterparty IBAN. May be empty (fees, FX). */
  counterpartyIban?: string;
  counterpartyName?: string;
  /** Signed amount in account currency. Positive = credit; negative = debit. */
  amount: number;
  currency: string;
  /** Payment details / remittance info. Free-form. */
  remittance?: string;
  /** Reference number (E2E ID). */
  referenceNumber?: string;
  /** LHV archival ID. Unique per row across statements; used for dedup. */
  archivalId: string;
  /** Counterparty BIC. */
  bic?: string;
}

export type ClassifiedSide = 'sales' | 'purchase' | 'fee' | 'transfer' | 'unknown';

export interface ClassifiedRow extends LhvRow {
  proposedVatCode: VatCodeName | null;
  proposedAccount: string;
  side: ClassifiedSide;
  matchedRuleId?: string;
}

/**
 * Classification rule. Matched in order; first hit wins.
 */
export interface ClassifierRule {
  id: string;
  /** Match by counterparty IBAN exact match, OR counterparty name substring, OR remittance substring. */
  match: {
    counterpartyIban?: string;
    counterpartyNameContains?: string;
    remittanceContains?: string;
    /** Only apply when amount sign matches: 'debit' for outgoing, 'credit' for incoming, undefined for either. */
    sign?: 'debit' | 'credit';
  };
  account: string;
  vatCode: VatCodeName | null;
  side: ClassifiedSide;
}
