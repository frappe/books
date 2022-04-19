import { DocValue } from 'fyo/core/types';
import Doc from 'fyo/model/doc';
import { DefaultMap, FiltersMap, FormulaMap } from 'fyo/model/types';
import { getExchangeRate } from 'models/helpers';
import { LedgerPosting } from 'models/ledgerPosting/ledgerPosting';
import Money from 'pesa/dist/types/src/money';
import { Party } from '../Party/Party';
import { Payment } from '../Payment/Payment';
import { Tax } from '../Tax/Tax';
import { TaxSummary } from '../TaxSummary/TaxSummary';

export abstract class Invoice extends Doc {
  _taxes: Record<string, Tax> = {};
  taxes?: TaxSummary[];

  party?: string;
  account?: string;
  currency?: string;
  netTotal?: Money;
  baseGrandTotal?: Money;
  exchangeRate?: number;

  abstract getPosting(): Promise<LedgerPosting>;

  get isSales() {
    return this.schemaName === 'SalesInvoice';
  }

  async getPayments() {
    const payments = await this.fyo.db.getAll('PaymentFor', {
      fields: ['parent'],
      filters: { referenceName: this.name! },
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
    await this.fyo.db.update(this.schemaName, {
      name: this.name as string,
      outstandingAmount: this.baseGrandTotal!,
    });

    const party = (await this.fyo.doc.getDoc('Party', this.party!)) as Party;
    await party.updateOutstandingAmount();
  }

  async afterRevert() {
    const paymentRefList = await this.getPayments();
    for (const paymentFor of paymentRefList) {
      const paymentReference = paymentFor.parent;
      const payment = (await this.fyo.doc.getDoc(
        'Payment',
        paymentReference as string
      )) as Payment;

      const paymentEntries = await payment.getPosting();
      for (const entry of paymentEntries) {
        await entry.postReverse();
      }

      // To set the payment status as unsubmitted.
      await this.fyo.db.update('Payment', {
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

    const accountingSettings = await this.fyo.doc.getSingle(
      'AccountingSettings'
    );
    const companyCurrency = accountingSettings.currency;
    if (this.currency === companyCurrency) {
      return 1.0;
    }
    return await getExchangeRate({
      fromCurrency: this.currency!,
      toCurrency: companyCurrency as string,
    });
  }

  async getTaxSummary() {
    const taxes: Record<
      string,
      {
        account: string;
        rate: number;
        amount: Money;
        baseAmount: Money;
        [key: string]: DocValue;
      }
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
          amount: this.fyo.pesa(0),
          baseAmount: this.fyo.pesa(0),
        };

        const amount = (row.amount as Money).mul(rate).div(100);
        taxes[account].amount = taxes[account].amount.add(amount);
      }
    }

    return Object.keys(taxes)
      .map((account) => {
        const tax = taxes[account];
        tax.baseAmount = tax.amount.mul(this.exchangeRate!);
        return tax;
      })
      .filter((tax) => !tax.amount.isZero());
  }

  async getTax(tax: string) {
    if (!this._taxes![tax]) {
      this._taxes[tax] = await this.fyo.doc.getDoc('Tax', tax);
    }

    return this._taxes[tax];
  }

  async getGrandTotal() {
    return ((this.taxes ?? []) as Doc[])
      .map((doc) => doc.amount as Money)
      .reduce((a, b) => a.add(b), this.netTotal!);
  }

  formulas: FormulaMap = {
    account: async () =>
      this.getFrom('Party', this.party!, 'defaultAccount') as string,
    currency: async () =>
      (this.getFrom('Party', this.party!, 'currency') as string) ||
      (this.fyo.singles.AccountingSettings!.currency as string),
    exchangeRate: async () => await this.getExchangeRate(),
    netTotal: async () => this.getSum('items', 'amount', false),
    baseNetTotal: async () => this.netTotal!.mul(this.exchangeRate!),
    taxes: async () => await this.getTaxSummary(),
    grandTotal: async () => await this.getGrandTotal(),
    baseGrandTotal: async () =>
      (this.grandTotal as Money).mul(this.exchangeRate!),
    outstandingAmount: async () => {
      if (this.submitted) {
        return;
      }

      return this.baseGrandTotal!;
    },
  };

  defaults: DefaultMap = {
    date: () => new Date().toISOString().slice(0, 10),
  };

  static filters: FiltersMap = {
    account: (doc: Doc) => ({
      isGroup: false,
      accountType: doc.isSales ? 'Receivable' : 'Payable',
    }),
    numberSeries: (doc: Doc) => ({ referenceType: doc.schemaName }),
  };
}
