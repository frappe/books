import Doc from 'fyo/model/doc';
import Money from 'pesa/dist/types/src/money';

export interface LedgerPostingOptions {
  reference: Doc;
  party?: string;
  date?: string;
  description?: string;
}
export interface LedgerEntry {
  account: string;
  party: string;
  date: string;
  referenceType: string;
  referenceName: string;
  description?: string;
  reverted: boolean;
  debit: Money;
  credit: Money;
}

export interface AccountEntry {
  name: string;
  balanceChange: Money;
}

export type TransactionType = 'credit' | 'debit';
