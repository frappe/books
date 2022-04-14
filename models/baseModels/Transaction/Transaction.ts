import { LedgerPosting } from 'accounting/ledgerPosting';
import frappe from 'frappe';
import Doc from 'frappe/model/doc';
import Money from 'pesa/dist/types/src/money';
import { getExchangeRate } from '../../../accounting/exchangeRate';
import { Party } from '../Party/Party';
import { Payment } from '../Payment/Payment';
import { Tax } from '../Tax/Tax';

export abstract class Transaction extends Doc {
  _taxes: Record<string, Tax> = {};

  abstract getPosting(): LedgerPosting;

  async getPayments() {
    const payments = await frappe.db.getAll('PaymentFor', {
      fields: ['parent'],
      filters: { referenceName: this.name as string },
      orderBy: 'name',
    });

    if (payments.length != 0) {
      return payments;
    }
    return [];
  }

  async beforeUpdate() {
    const entries = await this.getPosting();
    await entries.validateEntries();
  }

  async beforeInsert() {
    const entries = await this.getPosting();
    await entries.validateEntries();
  }

  async afterSubmit() {
    // post ledger entries
    const entries = await this.getPosting();
    await entries.post();

    // update outstanding amounts
    await frappe.db.update(this.schemaName, {
      name: this.name as string,
      outstandingAmount: this.baseGrandTotal as Money,
    });

    const party = (await frappe.doc.getDoc(
      'Party',
      this.party as string
    )) as Party;
    await party.updateOutstandingAmount();
  }

  async afterRevert() {
    const paymentRefList = await this.getPayments();
    for (const paymentFor of paymentRefList) {
      const paymentReference = paymentFor.parent;
      const payment = (await frappe.doc.getDoc(
        'Payment',
        paymentReference as string
      )) as Payment;

      const paymentEntries = await payment.getPosting();
      for (const entry of paymentEntries) {
        await entry.postReverse();
      }

      // To set the payment status as unsubmitted.
      await frappe.db.update('Payment', {
        name: paymentReference,
        submitted: false,
        cancelled: true,
      });
    }
    const entries = await this.getPosting();
    await entries.postReverse();
  }

  async getExchangeRate() {
    if (!this.currency) return 1.0;

    const accountingSettings = await frappe.doc.getSingle('AccountingSettings');
    const companyCurrency = accountingSettings.currency;
    if (this.currency === companyCurrency) {
      return 1.0;
    }
    return await getExchangeRate({
      fromCurrency: this.currency as string,
      toCurrency: companyCurrency as string,
    });
  }

  async getTaxSummary() {
    const taxes: Record<
      string,
      { account: string; rate: number; amount: Money; baseAmount?: Money }
    > = {};

    for (const row of this.items as Doc[]) {
      if (!row.tax) {
        continue;
      }

      const tax = await this.getTax(row.tax as string);
      for (const d of tax.details as Doc[]) {
        const account = d.account as string;
        const rate = d.rate as number;

        taxes[account] = taxes[account] || {
          account,
          rate,
          amount: frappe.pesa(0),
        };

        const amount = (row.amount as Money).mul(rate).div(100);
        taxes[account].amount = taxes[account].amount.add(amount);
      }
    }

    return Object.keys(taxes)
      .map((account) => {
        const tax = taxes[account];
        tax.baseAmount = tax.amount.mul(this.exchangeRate as number);
        return tax;
      })
      .filter((tax) => !tax.amount.isZero());
  }

  async getTax(tax: string) {
    if (!this._taxes![tax]) {
      this._taxes[tax] = await frappe.doc.getDoc('Tax', tax);
    }

    return this._taxes[tax];
  }

  async getGrandTotal() {
    return ((this.taxes ?? []) as Doc[])
      .map((doc) => doc.amount as Money)
      .reduce((a, b) => a.add(b), this.netTotal as Money);
  }
}
