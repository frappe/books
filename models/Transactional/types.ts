import { Doc } from 'fyo/model/doc';
import Money from 'pesa/dist/types/src/money';

export interface LedgerPostingOptions {
  reference: Doc;
  party?: string;
}

export interface LedgerEntry {
  account: string;
  party: string;
  date: string;
  referenceType: string;
  referenceName: string;
  reverted: boolean;
  debit: Money;
  credit: Money;
}

export interface AccountBalanceChange {
  name: string;
  change: Money;
}

export type TransactionType = 'credit' | 'debit';
