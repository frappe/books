import { DateTime } from 'luxon';
import { AccountRootType } from 'models/baseModels/Account/types';
import { BaseField, FieldType, RawValue } from 'schemas/types';

export type ExportExtention = 'csv' | 'json';

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
  isEmpty?: boolean;
  folded?: boolean;
  foldedBelow?: boolean;
}
export type ReportData = ReportRow[];
export interface ColumnField extends Omit<BaseField, 'fieldtype'> {
  fieldtype: FieldType;
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

export type DateRange = { fromDate: DateTime; toDate: DateTime };
export type ValueMap = Map<DateRange, Record<string, number>>;

export interface Account {
  name: string;
  rootType: AccountRootType;
  isGroup: boolean;
  parentAccount: string | null;
}

export type AccountTree = Record<string, AccountTreeNode>;
export interface AccountTreeNode extends Account {
  children?: AccountTreeNode[];
  valueMap?: ValueMap;
  prune?: boolean;
}

export type AccountList = AccountListNode[];
export interface AccountListNode extends Account {
  valueMap?: ValueMap;
  level?: number;
}

export type AccountNameValueMapMap = Map<string, ValueMap>;
export type BasedOn = 'Fiscal Year' | 'Until Date';

export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export type Tree = Record<string, TreeNode>;

export type RootTypeRow = {
  rootType: AccountRootType;
  rootNode: AccountTreeNode;
  rows: ReportData;
};