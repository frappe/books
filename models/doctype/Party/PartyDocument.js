const BaseDocument = require('frappejs/model/document');

module.exports = class Party extends BaseDocument {
  vaildate() {
    if (this.customer && this.supplier) {
      frappe.msgDialog('Invalid Party Type');
    }
  }
};
