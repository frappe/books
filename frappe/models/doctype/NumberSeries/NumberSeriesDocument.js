import { getPaddedName } from '@/utils';
import frappe from 'frappe';
import Document from 'frappe/model/document';

export default class NumberSeries extends Document {
  validate() {
    if (!this.current) {
      this.current = this.start;
    }
  }

  async next(doctype) {
    this.validate();

    const exists = await this.checkIfCurrentExists(doctype);
    if (!exists) {
      return this.getPaddedName(this.current);
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
}
