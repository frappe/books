const { getPaddedName } = require('@/utils');
const frappe = require('frappe');
const BaseDocument = require('frappe/model/document');

module.exports = class NumberSeries extends BaseDocument {
  validate() {
    if (!this.current) {
      this.current = this.start;
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
    return this.getPaddedName(this.current);
  }

  async checkIfCurrentExists(doctype) {
    if (!doctype) {
      return true;
    }

    const name = this.getPaddedName(this.current);
    return await frappe.db.exists(doctype, name);
  }

  getPaddedName(next) {
    return getPaddedName(this.name, next, this.padZeros);
  }
};
