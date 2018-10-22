const frappe = require('frappejs');
const registerReportMethods = require('../reports');

module.exports = function registerServerMethods() {
  registerReportMethods();

  frappe.registerMethod({
    method: 'import-coa',
    async handler() {
      const standardCOA = require('../fixtures/standardCOA');
      const importCOA = require('../models/doctype/Account/importCOA');
      await importCOA(standardCOA);
    }
  });

  frappe.registerMethod({
    method: 'print-pdf',
    handler({doctype, name, html}) {
      if (frappe.isElectron) {
        const path = require('path');
        const { getPDFForElectron } = require('frappejs/server/pdf');
        const { getSettings } = require('../electron/settings');
        const destination = path.resolve(getSettings().dbPath, '..')
        getPDFForElectron(doctype, name, destination, html);
      }
    }
  })
}