const frappe = require('frappejs');
const GeneralLedger = require('./GeneralLedger/GeneralLedger');
const ProfitAndLoss = require('./ProfitAndLoss/ProfitAndLoss');
const BalanceSheet = require('./BalanceSheet/BalanceSheet');
const TrialBalance = require('./TrialBalance/TrialBalance');
const SalesRegister = require('./SalesRegister/SalesRegister');
const PurchaseRegister = require('./PurchaseRegister/PurchaseRegister');

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

function getReportData(ReportClass) {
    return args => new ReportClass().run(args);
}

module.exports = registerReportMethods
