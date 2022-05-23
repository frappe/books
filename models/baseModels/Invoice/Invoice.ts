import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { DefaultMap, FiltersMap, FormulaMap } from 'fyo/model/types';
import { getExchangeRate } from 'models/helpers';
import { Transactional } from 'models/Transactional/Transactional';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { getIsNullOrUndef } from 'utils';
import { Party } from '../Party/Party';
import { Payment } from '../Payment/Payment';
import { Tax } from '../Tax/Tax';
import { TaxSummary } from '../TaxSummary/TaxSummary';

export abstract class Invoice extends Transactional {
  _taxes: Record<string, Tax> = {};
  taxes?: TaxSummary[];

  party?: string;
  account?: string;
  currency?: string;
  netTotal?: Money;
  grandTotal?: Money;
  baseGrandTotal?: Money;
  outstandingAmount?: Money;
  exchangeRate?: number;

  submitted?: boolean;
  cancelled?: boolean;

  get isSales() {
    return this.schemaName === 'SalesInvoice';
  }

  async afterSubmit() {
    await super.afterSubmit();

    // update outstanding amounts
    await this.fyo.db.update(this.schemaName, {
      name: this.name as string,
      outstandingAmount: this.baseGrandTotal!,
    });

    const party = (await this.fyo.doc.getDoc('Party', this.party!)) as Party;
    await party.updateOutstandingAmount();
  }

  async afterCancel() {
    await super.afterCancel();
    await this._cancelPayments();
    await this._updatePartyOutStanding();
  }

  async _cancelPayments() {
    const paymentIds = await this.getPaymentIds();
    for (const paymentId of paymentIds) {
      const paymentDoc = (await this.fyo.doc.getDoc(
        'Payment',
        paymentId
      )) as Payment;
      await paymentDoc.cancel();
    }
  }

  async _updatePartyOutStanding() {
    const partyDoc = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      this.party!
    )) as Party;

    await partyDoc.updateOutstandingAmount();
  }

  async afterDelete() {
    await super.afterDelete();
    const paymentIds = await this.getPaymentIds();
    for (const name of paymentIds) {
      const paymentDoc = await this.fyo.doc.getDoc(ModelNameEnum.Payment, name);
      await paymentDoc.delete();
    }
  }

  async getPaymentIds() {
    const payments = (await this.fyo.db.getAll('PaymentFor', {
      fields: ['parent'],
      filters: { referenceType: this.schemaName, referenceName: this.name! },
      orderBy: 'name',
    })) as { parent: string }[];

    if (payments.length != 0) {
      return [...new Set(payments.map(({ parent }) => parent))];
    }

    return [];
  }

  async getExchangeRate() {
    if (!this.currency) {
      return 1.0;
    }

    const currency = await this.fyo.getValue(
      ModelNameEnum.SystemSettings,
      'currency'
    );
    if (this.currency === currency) {
      return 1.0;
    }
    return await getExchangeRate({
      fromCurrency: this.currency!,
      toCurrency: currency as string,
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
    account: {
      formula: async () => {
        return (await this.fyo.getValue(
          'Party',
          this.party!,
          'defaultAccount'
        )) as string;
      },
      dependsOn: ['party'],
    },
    currency: {
      formula: async () => {
        const currency = (await this.fyo.getValue(
          'Party',
          this.party!,
          'currency'
        )) as string;

        if (!getIsNullOrUndef(currency)) {
          return currency;
        }
        return this.fyo.singles.SystemSettings!.currency as string;
      },
      dependsOn: ['party'],
    },
    exchangeRate: { formula: async () => await this.getExchangeRate() },
    netTotal: { formula: async () => this.getSum('items', 'amount', false) },
    baseNetTotal: {
      formula: async () => this.netTotal!.mul(this.exchangeRate!),
    },
    taxes: { formula: async () => await this.getTaxSummary() },
    grandTotal: { formula: async () => await this.getGrandTotal() },
    baseGrandTotal: {
      formula: async () => (this.grandTotal as Money).mul(this.exchangeRate!),
    },
    outstandingAmount: {
      formula: async () => {
        if (this.submitted) {
          return;
        }

        return this.baseGrandTotal!;
      },
    },
  };

  static defaults: DefaultMap = {
    date: () => new Date().toISOString().slice(0, 10),
  };

  static filters: FiltersMap = {
    party: (doc: Doc) => ({
      role: ['in', [doc.isSales ? 'Customer' : 'Supplier', 'Both']],
    }),
    account: (doc: Doc) => ({
      isGroup: false,
      accountType: doc.isSales ? 'Receivable' : 'Payable',
    }),
    numberSeries: (doc: Doc) => ({ referenceType: doc.schemaName }),
  };

  static createFilters: FiltersMap = {
    party: (doc: Doc) => ({
      role: doc.isSales ? 'Customer' : 'Supplier',
    }),
  };
}
