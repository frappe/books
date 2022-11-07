import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';

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

export type TransactionType = 'credit' | 'debit';
