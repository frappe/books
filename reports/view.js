const frappe = require('frappejs');
const GeneralLedgerView = require('../reports/GeneralLedger/GeneralLedgerView');
const ProfitAndLossView = require('./ProfitAndLoss/ProfitAndLossView');
const BalanceSheetView = require('./BalanceSheet/BalanceSheetView');
const TrialBalanceView = require('./TrialBalance/TrialBalanceView');
const SalesRegisterView = require('./SalesRegister/SalesRegisterView');
const PurchaseRegisterView = require('./PurchaseRegister/PurchaseRegisterView');
const AccountsReceivableView = require('./AccountsReceivablePayable/AccountsReceivableView');
const AccountsPayableView = require('./AccountsReceivablePayable/AccountsPayableView');

// called on client side
function registerReportRoutes() {
    frappe.router.add('report/general-ledger', async (params) => {
        if (!frappe.views.GeneralLedger) {
            frappe.views.GeneralLedger = new GeneralLedgerView();
        }
        await frappe.views.GeneralLedger.show(params);
    });

    frappe.router.add('report/profit-and-loss', async (params) => {
        if (!frappe.views.ProfitAndLoss) {
            frappe.views.ProfitAndLoss = new ProfitAndLossView();
        }
        await frappe.views.ProfitAndLoss.show(params);
    });

    frappe.router.add('report/balance-sheet', async (params) => {
        if (!frappe.views.BalanceSheet) {
            frappe.views.BalanceSheet = new BalanceSheetView();
        }
        await frappe.views.BalanceSheet.show(params);
    });

    frappe.router.add('report/trial-balance', async (params) => {
        if (!frappe.views.TrialBalance) {
            frappe.views.TrialBalance = new TrialBalanceView();
        }
        await frappe.views.TrialBalance.show(params);
    });

    frappe.router.add('report/sales-register', async (params) => {
        if (!frappe.views.SalesRegister) {
            frappe.views.SalesRegister = new SalesRegisterView();
        }
        await frappe.views.SalesRegister.show(params);
    });

    frappe.router.add('report/purchase-register', async (params) => {
        if (!frappe.views.PurchaseRegister) {
            frappe.views.PurchaseRegister = new PurchaseRegisterView();
        }
        await frappe.views.PurchaseRegister.show(params);
    });

    frappe.router.add('report/accounts-receivable', async (params) => {
        if (!frappe.views.AccountsReceivable) {
            frappe.views.AccountsReceivable = new AccountsReceivableView();
        }
        await frappe.views.AccountsReceivable.show(params);
    });

    frappe.router.add('report/accounts-payable', async (params) => {
        if (!frappe.views.AccountsPayable) {
            frappe.views.AccountsPayable = new AccountsPayableView();
        }
        await frappe.views.AccountsPayable.show(params);
    });
}

module.exports = registerReportRoutes;
