module.exports = {
  'general-ledger': require('./GeneralLedger/viewConfig'),
  'sales-register': require('./SalesRegister/viewConfig'),
  'profit-and-loss': require('./ProfitAndLoss/viewConfig'),
  'trial-balance': require('./TrialBalance/viewConfig'),
  'bank-reconciliation': require('./BankReconciliation/viewConfig'),
  'gstr-1': require('./GoodsAndServiceTax/GSTR1View'),
  'gstr-2': require('./GoodsAndServiceTax/GSTR2View')
};
