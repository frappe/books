import { AccountRootType } from 'models/baseModels/Account/types';
import { BaseField, RawValue } from 'schemas/types';

export type ExportExtension = 'csv' | 'json';

export interface ReportCell {
  bold?: boolean;
  italics?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number;
  value: string;
  rawValue: RawValue | undefined | Date;
  indent?: number;
  color?: 'red' | 'green';
}

export interface ReportRow {
  cells: ReportCell[];
  level?: number;
  isGroup?: boolean;
  folded?: boolean;
  foldedBelow?: boolean;
}
export type ReportData = ReportRow[];
export interface ColumnField extends BaseField {
  align?: 'left' | 'right' | 'center';
  width?: number;
}

export type BalanceType = 'Credit' | 'Debit';
export type Periodicity = 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';
export interface FinancialStatementOptions {
  rootType: AccountRootType;
  fromDate: string;
  toDate: string;
  balanceMustBe?: BalanceType;
  periodicity?: Periodicity;
  accumulateValues?: boolean;
}

export interface RawLedgerEntry {
  name: string;
  account: string;
  date: string;
  debit: string;
  credit: string;
  referenceType: string;
  referenceName: string;
  party: string;
  reverted: number;
  reverts: string;
  [key: string]: RawValue;
}

export interface LedgerEntry {
  index?: string;
  name: number;
  account: string;
  date: Date | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  referenceType: string;
  referenceName: string;
  party: string;
  reverted: boolean;
  reverts: string;
}

export type GroupedMap = Map<string, LedgerEntry[]>;
