const frappe = require('frappejs');

const GeneralLedger = require('./GeneralLedger/GeneralLedger');
const GeneralLedgerView = require('../reports/generalLedger/GeneralLedgerView');

const ProfitAndLoss = require('./ProfitAndLoss/ProfitAndLoss');
const ProfitAndLossView = require('./ProfitAndLoss/ProfitAndLossView');

const BalanceSheet = require('./BalanceSheet/BalanceSheet');
const BalanceSheetView = require('./BalanceSheet/BalanceSheetView');

const TrialBalance = require('./TrialBalance/TrialBalance');
const TrialBalanceView = require('./TrialBalance/TrialBalanceView');

const SalesRegister = require('./SalesRegister/SalesRegister');
const SalesRegisterView = require('./SalesRegister/SalesRegisterView');

const PurchaseRegister = require('./PurchaseRegister/PurchaseRegister');
const PurchaseRegisterView = require('./PurchaseRegister/PurchaseRegisterView');

// called on server side
function registerReportMethods() {
    frappe.registerMethod({
        method: 'general-ledger',
        handler: getReportData(GeneralLedger)
    });

    frappe.registerMethod({
        method: 'profit-and-loss',
        handler: getReportData(ProfitAndLoss)
    });

    frappe.registerMethod({
        method: 'balance-sheet',
        handler: getReportData(BalanceSheet)
    });

    frappe.registerMethod({
        method: 'trial-balance',
        handler: getReportData(TrialBalance)
    });

    frappe.registerMethod({
        method: 'sales-register',
        handler: getReportData(SalesRegister)
    });

    frappe.registerMethod({
        method: 'purchase-register',
        handler: getReportData(PurchaseRegister)
    });
}

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
}

function getReportData(ReportClass) {
    return args => new ReportClass().run(args);
}

module.exports = {
    registerReportMethods,
    registerReportRoutes
}
