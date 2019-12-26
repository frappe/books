const frappe = require('frappejs');
const registerReportMethods = require('../reports');

module.exports = function registerServerMethods() {
  registerReportMethods();

  frappe.registerMethod({
    method: 'import-coa',
    async handler() {
      const importCOA = require('../accounting/importCOA');
      await importCOA();
    }
  });
};
