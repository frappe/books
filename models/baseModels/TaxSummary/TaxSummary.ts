import { Fyo } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { CurrenciesMap } from 'fyo/model/types';
import { DEFAULT_CURRENCY } from 'fyo/utils/consts';
import { Money } from 'pesa';
import { FieldTypeEnum, Schema } from 'schemas/types';
import { Invoice } from '../Invoice/Invoice';

export class TaxSummary extends Doc {
  account?: string;
  rate?: number;
  amount?: Money;
  parentdoc?: Invoice;

  get exchangeRate() {
    return this.parentdoc?.exchangeRate ?? 1;
  }

  get currency() {
    return this.parentdoc?.currency ?? DEFAULT_CURRENCY;
  }

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);
    this._setGetCurrencies();
  }

  getCurrencies: CurrenciesMap = {};
  _getCurrency() {
    if (this.exchangeRate === 1) {
      return this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY;
    }

    return this.currency;
  }
  _setGetCurrencies() {
    const currencyFields = this.schema.fields.filter(
      ({ fieldtype }) => fieldtype === FieldTypeEnum.Currency
    );

    const getCurrency = this._getCurrency.bind(this);

    for (const { fieldname } of currencyFields) {
      this.getCurrencies[fieldname] ??= getCurrency;
    }
  }
}
