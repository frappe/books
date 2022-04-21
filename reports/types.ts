import { AccountRootType } from 'models/baseModels/Account/types';

export type ExportExtension = 'csv' | 'json';

export interface ReportData {
  rows: unknown[];
  columns: unknown[];
}

export abstract class Report {
  abstract run(filters: Record<string, unknown>): ReportData;
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
