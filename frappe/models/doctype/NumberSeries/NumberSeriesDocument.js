const frappe = require('frappe');
const BaseDocument = require('frappe/model/document');

module.exports = class NumberSeries extends BaseDocument {
  validate() {
    if (this.current === null || this.current === undefined) {
      this.current = 0;
    }
  }
  async next(doctype) {
    this.validate();

    const exists = await this.checkIfCurrentExists(doctype);
    if (!exists) {
      return this.current;
    }

    this.current++;
    await this.update();
    return this.current;
  }

  async checkIfCurrentExists(doctype) {
    if (!doctype) {
      return true;
    }
    return await frappe.db.exists(doctype, this.name + this.current);
  }
};
