export enum AccountRootTypeEnum  {
'Asset'='Asset',
'Liability'='Liability',
'Equity'='Equity',
'Income'='Income',
'Expense'='Expense',
}

export enum AccountTypeEnum {
  'Accumulated Depreciation' = 'Accumulated Depreciation',
  'Bank' = 'Bank',
  'Cash' = 'Cash',
  'Chargeable' = 'Chargeable',
  'Cost of Goods Sold' = 'Cost of Goods Sold',
  'Depreciation' = 'Depreciation',
  'Equity' = 'Equity',
  'Expense Account' = 'Expense Account',
  'Expenses Included In Valuation' = 'Expenses Included In Valuation',
  'Fixed Asset' = 'Fixed Asset',
  'Income Account' = 'Income Account',
  'Payable' = 'Payable',
  'Receivable' = 'Receivable',
  'Round Off' = 'Round Off',
  'Stock' = 'Stock',
  'Stock Adjustment' = 'Stock Adjustment',
  'Stock Received But Not Billed' = 'Stock Received But Not Billed',
  'Tax' = 'Tax',
  'Temporary' = 'Temporary',
}

export type AccountType = keyof typeof AccountTypeEnum;
export type AccountRootType = keyof typeof AccountRootTypeEnum

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
