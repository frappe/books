module.exports = {
  'general-ledger': require('./GeneralLedger/viewConfig').default,
  'sales-register': require('./SalesRegister/viewConfig'),
  'purchase-register': require('./PurchaseRegister/viewConfig'),
  'balance-sheet': require('./BalanceSheet/viewConfig'),
  'profit-and-loss': require('./ProfitAndLoss/viewConfig'),
  'trial-balance': require('./TrialBalance/viewConfig')
  //   'bank-reconciliation': require('./BankReconciliation/viewConfig'),
  //   'gstr-1': require('./GoodsAndServiceTax/GSTR1View'),
  //   'gstr-2': require('./GoodsAndServiceTax/GSTR2View')
};
