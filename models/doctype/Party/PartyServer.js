const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');

module.exports = class PartyServer extends BaseDocument {
  beforeInsert() {
    if (this.customer && this.supplier) {
      frappe.call({
        method: 'show-dialog',
        args: {
          title: 'Invalid Entry',
          message: 'Select a single party type.'
        }
      });
      throw new Error();
    }

    if (this.gstin && ['Unregistered', 'Consumer'].includes(this.gstType)) {
      this.gstin = '';
    }
  }
};
