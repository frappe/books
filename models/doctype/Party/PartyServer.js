import BaseDocument from 'frappejs/model/document';
import frappe from 'frappejs';

export default class PartyServer extends BaseDocument {
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

  async updateOutstandingAmount() {
    let isCustomer = this.customer;
    let doctype = isCustomer ? 'SalesInvoice' : 'PurchaseInvoice';
    let partyField = isCustomer ? 'customer' : 'supplier';
    let { totalOutstanding } = await frappe.db.knex
      .sum({ totalOutstanding: 'outstandingAmount' })
      .from(doctype)
      .where('submitted', 1)
      .andWhere(partyField, this.name)
      .first();

    await this.set('outstandingAmount', this.round(totalOutstanding));
    await this.update();
  }
};
