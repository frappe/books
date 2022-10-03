import { Fyo } from 'fyo';
import { DocValue, DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  CurrenciesMap,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  HiddenMap
} from 'fyo/model/types';
import { DEFAULT_CURRENCY } from 'fyo/utils/consts';
import { ValidationError } from 'fyo/utils/errors';
import { getExchangeRate } from 'models/helpers';
import { Transactional } from 'models/Transactional/Transactional';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { FieldTypeEnum, Schema } from 'schemas/types';
import { getIsNullOrUndef } from 'utils';
import { InvoiceItem } from '../InvoiceItem/InvoiceItem';
import { Party } from '../Party/Party';
import { Payment } from '../Payment/Payment';
import { Tax } from '../Tax/Tax';
import { TaxSummary } from '../TaxSummary/TaxSummary';

export abstract class Invoice extends Transactional {
  _taxes: Record<string, Tax> = {};
  taxes?: TaxSummary[];

  items?: InvoiceItem[];
  party?: string;
  account?: string;
  currency?: string;
  netTotal?: Money;
  grandTotal?: Money;
  baseGrandTotal?: Money;
  outstandingAmount?: Money;
  exchangeRate?: number;
  setDiscountAmount?: boolean;
  discountAmount?: Money;
  discountPercent?: number;
  discountAfterTax?: boolean;

  submitted?: boolean;
  cancelled?: boolean;

  get isSales() {
    return this.schemaName === 'SalesInvoice';
  }

  get enableDiscounting() {
    return !!this.fyo.singles?.AccountingSettings?.enableDiscounting;
  }

  get isMultiCurrency() {
    if (!this.currency) {
      return false;
    }

    return this.fyo.singles.SystemSettings!.currency !== this.currency;
  }

  get companyCurrency() {
    return this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY;
  }

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);
    this._setGetCurrencies();
  }

  async validate() {
    await super.validate();
    if (
      this.enableDiscounting &&
      !this.fyo.singles?.AccountingSettings?.discountAccount
    ) {
      throw new ValidationError(this.fyo.t`Discount Account is not set.`);
    }
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
    const exchangeRate = await getExchangeRate({
      fromCurrency: this.currency!,
      toCurrency: currency as string,
    });

    return parseFloat(exchangeRate.toFixed(2));
  }

  async getTaxSummary() {
    const taxes: Record<
      string,
      {
        account: string;
        rate: number;
        amount: Money;
        [key: string]: DocValue;
      }
    > = {};

    type TaxDetail = { account: string; rate: number };

    for (const item of this.items ?? []) {
      if (!item.tax) {
        continue;
      }

      const tax = await this.getTax(item.tax!);
      for (const { account, rate } of (tax.details ?? []) as TaxDetail[]) {
        taxes[account] ??= {
          account,
          rate,
          amount: this.fyo.pesa(0),
        };

        let amount = item.amount!;
        if (this.enableDiscounting && !this.discountAfterTax) {
          amount = item.itemDiscountedTotal!;
        }

        const taxAmount = amount.mul(rate / 100);
        taxes[account].amount = taxes[account].amount.add(taxAmount);
      }
    }

    return Object.keys(taxes)
      .map((account) => {
        return taxes[account];
      })
      .filter((tax) => !tax.amount.isZero());
  }

  async getTax(tax: string) {
    if (!this._taxes![tax]) {
      this._taxes[tax] = await this.fyo.doc.getDoc('Tax', tax);
    }

    return this._taxes[tax];
  }

  getTotalDiscount() {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    const itemDiscountAmount = this.getItemDiscountAmount();
    const invoiceDiscountAmount = this.getInvoiceDiscountAmount();
    return itemDiscountAmount.add(invoiceDiscountAmount);
  }

  async getGrandTotal() {
    const totalDiscount = this.getTotalDiscount();
    return ((this.taxes ?? []) as Doc[])
      .map((doc) => doc.amount as Money)
      .reduce((a, b) => a.add(b), this.netTotal!)
      .sub(totalDiscount);
  }

  getInvoiceDiscountAmount() {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    if (this.setDiscountAmount) {
      return this.discountAmount ?? this.fyo.pesa(0);
    }

    let totalItemAmounts = this.fyo.pesa(0);
    for (const item of this.items ?? []) {
      if (this.discountAfterTax) {
        totalItemAmounts = totalItemAmounts.add(item.itemTaxedTotal!);
      } else {
        totalItemAmounts = totalItemAmounts.add(item.itemDiscountedTotal!);
      }
    }

    return totalItemAmounts.percent(this.discountPercent ?? 0);
  }

  getItemDiscountAmount() {
    if (!this.enableDiscounting) {
      return this.fyo.pesa(0);
    }

    if (!this?.items?.length) {
      return this.fyo.pesa(0);
    }

    let discountAmount = this.fyo.pesa(0);
    for (const item of this.items) {
      if (item.setItemDiscountAmount) {
        discountAmount = discountAmount.add(
          item.itemDiscountAmount ?? this.fyo.pesa(0)
        );
      } else if (!this.discountAfterTax) {
        discountAmount = discountAmount.add(
          (item.amount ?? this.fyo.pesa(0)).mul(
            (item.itemDiscountPercent ?? 0) / 100
          )
        );
      } else if (this.discountAfterTax) {
        discountAmount = discountAmount.add(
          (item.itemTaxedTotal ?? this.fyo.pesa(0)).mul(
            (item.itemDiscountPercent ?? 0) / 100
          )
        );
      }
    }

    return discountAmount;
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
    exchangeRate: {
      formula: async () => {
        if (
          this.currency ===
          (this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY)
        ) {
          return 1;
        }

        if (this.exchangeRate && this.exchangeRate !== 1) {
          return this.exchangeRate;
        }

        return await this.getExchangeRate();
      },
    },
    netTotal: { formula: async () => this.getSum('items', 'amount', false) },
    taxes: { formula: async () => await this.getTaxSummary() },
    grandTotal: { formula: async () => await this.getGrandTotal() },
    baseGrandTotal: {
      formula: async () =>
        (this.grandTotal as Money).mul(this.exchangeRate! ?? 1),
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

  getItemDiscountedAmounts() {
    let itemDiscountedAmounts = this.fyo.pesa(0);
    for (const item of this.items ?? []) {
      itemDiscountedAmounts = itemDiscountedAmounts.add(
        item.itemDiscountedTotal ?? item.amount!
      );
    }
    return itemDiscountedAmounts;
  }

  hidden: HiddenMap = {
    setDiscountAmount: () => true || !this.enableDiscounting,
    discountAmount: () =>
      true || !(this.enableDiscounting && !!this.setDiscountAmount),
    discountPercent: () =>
      true || !(this.enableDiscounting && !this.setDiscountAmount),
    discountAfterTax: () => !this.enableDiscounting,
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

  getCurrencies: CurrenciesMap = {
    baseGrandTotal: () => this.companyCurrency,
    outstandingAmount: () => this.companyCurrency,
  };
  _getCurrency() {
    if (this.exchangeRate === 1) {
      return this.companyCurrency;
    }

    return this.currency ?? DEFAULT_CURRENCY;
  }
  _setGetCurrencies() {
    const currencyFields = this.schema.fields.filter(
      ({ fieldtype }) => fieldtype === FieldTypeEnum.Currency
    );

    for (const { fieldname } of currencyFields) {
      this.getCurrencies[fieldname] ??= this._getCurrency.bind(this);
    }
  }
}
