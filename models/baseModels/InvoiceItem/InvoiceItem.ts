import frappe from 'frappe';
import { DocValue } from 'frappe/core/types';
import Doc from 'frappe/model/doc';
import {
  DependsOnMap,
  FiltersMap,
  FormulaMap,
  ValidationMap,
} from 'frappe/model/types';
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
    description: () =>
      this.parentdoc!.getFrom(
        'Item',
        this.item as string,
        'description'
      ) as string,
    rate: async () => {
      const baseRate = ((await this.parentdoc!.getFrom(
        'Item',
        this.item as string,
        'rate'
      )) || frappe.pesa(0)) as Money;

      return baseRate.div(this.exchangeRate!);
    },
    baseRate: () =>
      (this.rate as Money).mul(this.parentdoc!.exchangeRate as number),
    account: () => {
      let accountType = 'expenseAccount';
      if (this.isSales) {
        accountType = 'incomeAccount';
      }
      return this.parentdoc!.getFrom('Item', this.item as string, accountType);
    },
    tax: () => {
      if (this.tax) {
        return this.tax as string;
      }

      return this.parentdoc!.getFrom(
        'Item',
        this.item as string,
        'tax'
      ) as string;
    },
    amount: () => (this.rate as Money).mul(this.quantity as number),
    baseAmount: () =>
      (this.amount as Money).mul(this.parentdoc!.exchangeRate as number),
    hsnCode: () =>
      this.parentdoc!.getFrom('Item', this.item as string, 'hsnCode'),
  };

  dependsOn: DependsOnMap = {
    hsnCode: ['item'],
  };

  validations: ValidationMap = {
    rate: async (value: DocValue) => {
      if ((value as Money).gte(0)) {
        return;
      }

      throw new frappe.errors.ValidationError(
        frappe.t`Rate (${frappe.format(
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
