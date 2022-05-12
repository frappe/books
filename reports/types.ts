import { AccountRootType } from 'models/baseModels/Account/types';
import { BaseField } from 'schemas/types';

export type ExportExtension = 'csv' | 'json';

export interface ReportCell {
  bold?: boolean;
  italics?: boolean;
  align?: 'left' | 'right' | 'center';
  value: string;
}

export type ReportRow = ReportCell[];
export type ReportData = ReportRow[];
export interface ColumnField extends BaseField {
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
