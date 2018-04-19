const frappe = require('frappejs');

const GeneralLedger = require('./GeneralLedger/GeneralLedger');
const GeneralLedgerView = require('../reports/generalLedger/GeneralLedgerView');

const ProfitAndLoss = require('./ProfitAndLoss/ProfitAndLoss');
const ProfitAndLossView = require('./ProfitAndLoss/ProfitAndLossView');

// called on server side
function registerReportMethods() {
    frappe.registerMethod({
        method: 'general-ledger',
        handler: args => GeneralLedger(args)
    });

    frappe.registerMethod({
        method: 'profit-and-loss',
        handler: args => ProfitAndLoss(args)
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
}

module.exports = {
    registerReportMethods,
    registerReportRoutes
}
