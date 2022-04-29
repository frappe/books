import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import Money from 'pesa/dist/types/src/money';
import { Invoice } from '../Invoice/Invoice';

export abstract class InvoiceItem extends Doc {
  account?: string;
  baseAmount?: Money;
  exchangeRate?: number;
  parentdoc?: Invoice;

  get isSales() {
    return this.schemaName === 'SalesInvoiceItem';
  }

  formulas: FormulaMap = {
    description: {
      formula: () =>
        this.parentdoc!.getFrom(
          'Item',
          this.item as string,
          'description'
        ) as string,
      dependsOn: ['item'],
    },
    rate: {
      formula: async () => {
        const baseRate = ((await this.parentdoc!.getFrom(
          'Item',
          this.item as string,
          'rate'
        )) || this.fyo.pesa(0)) as Money;

        return baseRate.div(this.exchangeRate!);
      },
      dependsOn: ['item'],
    },
    baseRate: {
      formula: () =>
        (this.rate as Money).mul(this.parentdoc!.exchangeRate as number),
      dependsOn: ['item', 'rate'],
    },
    account: {
      formula: () => {
        let accountType = 'expenseAccount';
        if (this.isSales) {
          accountType = 'incomeAccount';
        }
        return this.parentdoc!.getFrom(
          'Item',
          this.item as string,
          accountType
        );
      },
      dependsOn: ['item'],
    },
    tax: {
      formula: () => {
        if (this.tax) {
          return this.tax as string;
        }

        return this.parentdoc!.getFrom(
          'Item',
          this.item as string,
          'tax'
        ) as string;
      },
      dependsOn: ['item'],
    },
    amount: {
      formula: () => (this.rate as Money).mul(this.quantity as number),
      dependsOn: ['item', 'rate', 'quantity'],
    },
    baseAmount: {
      formula: () =>
        (this.amount as Money).mul(this.parentdoc!.exchangeRate as number),
      dependsOn: ['item', 'amount', 'rate', 'quantity'],
    },
    hsnCode: {
      formula: () =>
        this.parentdoc!.getFrom('Item', this.item as string, 'hsnCode'),
      dependsOn: ['item'],
    },
  };

  validations: ValidationMap = {
    rate: async (value: DocValue) => {
      if ((value as Money).gte(0)) {
        return;
      }

      throw new ValidationError(
        this.fyo.t`Rate (${this.fyo.format(
          value,
          'Currency'
        )}) cannot be less zero.`
      );
    },
  };

  static filters: FiltersMap = {
    item: (doc: Doc) => {
      const itemList = doc.parentdoc!.items as Doc[];
      const items = itemList.map((d) => d.item as string).filter(Boolean);

      let itemNotFor = 'sales';
      if (doc.isSales) {
        itemNotFor = 'purchases';
      }

      const baseFilter = { for: ['not in', [itemNotFor]] };
      if (items.length <= 0) {
        return baseFilter;
      }

      return {
        name: ['not in', items],
        ...baseFilter,
      };
    },
  };
}
