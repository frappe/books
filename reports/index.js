/*
import AccountsReceivablePayable from './AccountsReceivablePayable/AccountsReceivablePayable';
import BalanceSheet from './BalanceSheet/BalanceSheet';
import BankReconciliation from './BankReconciliation/BankReconciliation';
import GeneralLedger from './GeneralLedger/GeneralLedger';
import GSTR1 from './GoodsAndServiceTax/GSTR1';
import GSTR2 from './GoodsAndServiceTax/GSTR2';
import ProfitAndLoss from './ProfitAndLoss/ProfitAndLoss';
import PurchaseRegister from './PurchaseRegister/PurchaseRegister';
import SalesRegister from './SalesRegister/SalesRegister';
import TrialBalance from './TrialBalance/TrialBalance';

export function getReportData(method, filters) {
  const reports = {
    'general-ledger': GeneralLedger,
    'profit-and-loss': ProfitAndLoss,
    'balance-sheet': BalanceSheet,
    'trial-balance': TrialBalance,
    'gstr-1': GSTR1,
    'gstr-2': GSTR2,
    'sales-register': SalesRegister,
    'purchase-register': PurchaseRegister,
    'bank-reconciliation': BankReconciliation,
  };

  if (method === 'accounts-receivable') {
    return new AccountsReceivablePayable().run('Receivable', filters);
  }

  if (method === 'accounts-payable') {
    return new AccountsReceivablePayable().run('Payable', filters);
  }

  const ReportClass = reports[method];
  return new ReportClass().run(filters);
}
*/
export function getReportData(method, filters) {
  return { rows: [], columns: [] };
}
