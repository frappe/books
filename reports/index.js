import frappe from 'frappe';
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

// called on server side
function registerReportMethods() {
  const reports = [
    {
      method: 'general-ledger',
      class: GeneralLedger,
    },
    {
      method: 'profit-and-loss',
      class: ProfitAndLoss,
    },
    {
      method: 'balance-sheet',
      class: BalanceSheet,
    },
    {
      method: 'trial-balance',
      class: TrialBalance,
    },
    {
      method: 'sales-register',
      class: SalesRegister,
    },
    {
      method: 'purchase-register',
      class: PurchaseRegister,
    },
    {
      method: 'bank-reconciliation',
      class: BankReconciliation,
    },
    {
      method: 'gstr-1',
      class: GSTR1,
    },
    {
      method: 'gstr-2',
      class: GSTR2,
    },
  ];

  reports.forEach((report) => {
    frappe.registerMethod({
      method: report.method,
      handler: getReportData(report.class),
    });
  });

  frappe.registerMethod({
    method: 'accounts-receivable',
    handler: (args) => new AccountsReceivablePayable().run('Receivable', args),
  });

  frappe.registerMethod({
    method: 'accounts-payable',
    handler: (args) => new AccountsReceivablePayable().run('Payable', args),
  });
}

function getReportData(ReportClass) {
  return (args) => new ReportClass().run(args);
}

export default registerReportMethods;
