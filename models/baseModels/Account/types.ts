export type AccountType =
  | 'Accumulated Depreciation'
  | 'Bank'
  | 'Cash'
  | 'Chargeable'
  | 'Cost of Goods Sold'
  | 'Depreciation'
  | 'Equity'
  | 'Expense Account'
  | 'Expenses Included In Valuation'
  | 'Fixed Asset'
  | 'Income Account'
  | 'Payable'
  | 'Receivable'
  | 'Round Off'
  | 'Stock'
  | 'Stock Adjustment'
  | 'Stock Received But Not Billed'
  | 'Tax'
  | 'Temporary';

export type AccountRootType =
  | 'Asset'
  | 'Liability'
  | 'Equity'
  | 'Income'
  | 'Expense';


export interface COARootAccount {
  rootType: AccountRootType;
  [key: string]: COAChildAccount | AccountRootType;
}

export interface COAChildAccount {
  accountType?: AccountType;
  accountNumber?: string;
  isGroup?: boolean;
  [key: string]: COAChildAccount | boolean | AccountType | string | undefined;
}

export interface COATree {
  [key: string]: COARootAccount;
}
