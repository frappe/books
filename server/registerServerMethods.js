const frappe = require('frappejs');
const registerReportMethods = require('../reports');
const sender = require('../email/sender');

module.exports = function registerServerMethods() {
  registerReportMethods();

  frappe.registerMethod({
    method: 'send-mail',
    handler: sender.sendMail
  });

  frappe.registerMethod({
    method: 'import-coa',
    async handler() {
      const importCOA = require('../models/doctype/Account/importCOA');
      await importCOA();
    }
  });

  frappe.registerMethod({
    method: 'print-pdf',
    handler({ doctype, name, html }) {
      if (frappe.isElectron) {
        const path = require('path');
        const { getPDFForElectron } = require('frappejs/server/pdf');
        const { getSettings } = require('../electron/settings');
        const destination = path.resolve('.');
        getPDFForElectron(doctype, name, destination, html);
      }
    }
  });
  frappe.registerMethod({
    method: 'show_dialog',
    handler({ title, message }) {
      frappe.showModal({
        modalProps: { title, noFooter: true },
        component: require('../src/components/MessageDialog').default,
        props: { message }
      });
    }
  });
};
