const GSTR3B = require('./GSTR3BDocument');

module.exports = class GSTR3BServer extends GSTR3B {
  async validate() {
    if (this.month.length === 0 || this.year.length != 4) {
      frappe.call({
        method: 'show-dialog',
        args: {
          title: 'Invalid Entry',
          message: `Month or Year is not valid`
        }
      });
      throw new Error();
    }
  }
  async beforeInsert() {
    this.name = `${this.doctype} Report ${this.month} ${this.year}`;
  }
};
