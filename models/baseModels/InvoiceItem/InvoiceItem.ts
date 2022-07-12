import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { Invoice } from '../Invoice/Invoice';

export abstract class InvoiceItem extends Doc {
  account?: string;
  amount?: Money;
  baseAmount?: Money;
  exchangeRate?: number;
  itemDiscountPercent?: number;
  itemDiscountAmount?: Money;
  parentdoc?: Invoice;
  rate?: Money;
  quantity?: number;
  tax?: string;

  get isSales() {
    return this.schemaName === 'SalesInvoiceItem';
  }

  get discountAfterTax() {
    return !!this?.parentdoc?.discountAfterTax;
  }

  async getTotalTaxRate(): Promise<number> {
    if (!this.tax) {
      return 0;
    }

    const details =
      ((await this.fyo.getValue('Tax', this.tax, 'details')) as Doc[]) ?? [];
    return details.reduce((acc, doc) => {
      return (doc.rate as number) + acc;
    }, 0);
  }

  formulas: FormulaMap = {
    description: {
      formula: async () =>
        (await this.fyo.getValue(
          'Item',
          this.item as string,
          'description'
        )) as string,
      dependsOn: ['item'],
    },
    itemDiscountAmount: {
      formula: async (fieldname) => {
        if (fieldname === 'itemDiscountPercent') {
          return this.amount!.percent(this.itemDiscountPercent ?? 0);
        }

        return this.fyo.pesa(0);
      },
      dependsOn: ['itemDiscountPercent'],
    },
    itemDiscountPercent: {
      formula: async (fieldname) => {
        const itemDiscountAmount = this.itemDiscountAmount ?? this.fyo.pesa(0);
        if (!this.discountAfterTax) {
          return itemDiscountAmount.div(this.amount ?? 0).mul(100).float;
        }

        const totalTaxRate = await this.getTotalTaxRate();
        const rate = this.rate ?? this.fyo.pesa(0);
        const quantity = this.quantity ?? 1;
        const taxedTotal = getTaxedTotalBeforeDiscounting(
          totalTaxRate,
          rate,
          quantity
        );

        return itemDiscountAmount.div(taxedTotal).mul(100).float;
      },
      dependsOn: ['itemDiscountAmount'],
    },
    itemDiscountedTotal: {
      formula: async (fieldname) => {
        const totalTaxRate = await this.getTotalTaxRate();
        const rate = this.rate ?? this.fyo.pesa(0);
        const quantity = this.quantity ?? 1;
        const itemDiscountAmount = this.itemDiscountAmount ?? this.fyo.pesa(0);
        const itemDiscountPercent = this.itemDiscountPercent ?? 0;

        if (!this.discountAfterTax) {
          return getDiscountedTotalBeforeTaxation(
            rate,
            quantity,
            itemDiscountAmount,
            itemDiscountPercent,
            fieldname
          );
        }

        return getDiscountedTotalAfterTaxation(
          totalTaxRate,
          rate,
          quantity,
          itemDiscountAmount,
          itemDiscountPercent,
          fieldname
        );
      },
      dependsOn: [
        'item',
        'rate',
        'tax',
        'quantity',
        'itemDiscountAmount',
        'itemDiscountPercent',
      ],
    },
    itemTaxedTotal: {
      formula: async (fieldname) => {
        const totalTaxRate = await this.getTotalTaxRate();
        const rate = this.rate ?? this.fyo.pesa(0);
        const quantity = this.quantity ?? 1;
        const itemDiscountAmount = this.itemDiscountAmount ?? this.fyo.pesa(0);
        const itemDiscountPercent = this.itemDiscountPercent ?? 0;

        if (!this.discountAfterTax) {
          return getTaxedTotalAfterDiscounting(
            totalTaxRate,
            rate,
            quantity,
            itemDiscountAmount,
            itemDiscountPercent,
            fieldname
          );
        }

        return getTaxedTotalBeforeDiscounting(totalTaxRate, rate, quantity);
      },
      dependsOn: [
        'item',
        'rate',
        'tax',
        'quantity',
        'itemDiscountAmount',
        'itemDiscountPercent',
      ],
    },
    rate: {
      formula: async () => {
        const rate = (await this.fyo.getValue(
          'Item',
          this.item as string,
          'rate'
        )) as undefined | Money;

        return rate ?? this.fyo.pesa(0);
      },
      dependsOn: ['item'],
    },
    baseRate: {
      formula: () =>
        (this.rate as Money).mul(this.parentdoc!.exchangeRate as number),
      dependsOn: ['item', 'rate'],
    },
    quantity: {
      formula: async () => {
        if (!this.item) {
          return this.quantity as number;
        }

        const itemDoc = await this.fyo.doc.getDoc(
          ModelNameEnum.Item,
          this.item as string
        );

        const unitDoc = itemDoc.getLink('unit');
        if (unitDoc?.isWhole) {
          return Math.round(this.quantity as number);
        }

        return this.quantity as number;
      },
      dependsOn: ['quantity'],
    },
    account: {
      formula: () => {
        let accountType = 'expenseAccount';
        if (this.isSales) {
          accountType = 'incomeAccount';
        }
        return this.fyo.getValue('Item', this.item as string, accountType);
      },
      dependsOn: ['item'],
    },
    tax: {
      formula: async () => {
        return (await this.fyo.getValue(
          'Item',
          this.item as string,
          'tax'
        )) as string;
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
      formula: async () =>
        await this.fyo.getValue('Item', this.item as string, 'hsnCode'),
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

      let itemNotFor = 'Sales';
      if (doc.isSales) {
        itemNotFor = 'Purchases';
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
  static createFilters: FiltersMap = {
    item: (doc: Doc) => {
      return { for: doc.isSales ? 'Sales' : 'Purchases' };
    },
  };
}

function getDiscountedTotalBeforeTaxation(
  rate: Money,
  quantity: number,
  itemDiscountAmount: Money,
  itemDiscountPercent: number,
  fieldname?: string
) {
  /**
   * If Discount is applied before taxation
   * Use different formulas depending on how discount is set
   * - if amount : Quantity * Rate - DiscountAmount
   * - if percent: Quantity * Rate (1 - DiscountPercent / 100)
   */
  const amount = rate.mul(quantity);
  if (fieldname === 'itemDiscountAmount') {
    return amount.sub(itemDiscountAmount);
  }

  return amount.mul(1 - itemDiscountPercent / 100);
}

function getTaxedTotalAfterDiscounting(
  totalTaxRate: number,
  rate: Money,
  quantity: number,
  itemDiscountAmount: Money,
  itemDiscountPercent: number,
  fieldname?: string
) {
  /**
   * If Discount is applied before taxation
   * Formula: Discounted Total * (1 + TotalTaxRate / 100)
   */

  const discountedTotal = getDiscountedTotalBeforeTaxation(
    rate,
    quantity,
    itemDiscountAmount,
    itemDiscountPercent,
    fieldname
  );

  return discountedTotal.mul(1 + totalTaxRate / 100);
}

function getDiscountedTotalAfterTaxation(
  totalTaxRate: number,
  rate: Money,
  quantity: number,
  itemDiscountAmount: Money,
  itemDiscountPercent: number,
  fieldname?: string
) {
  /**
   * If Discount is applied after taxation
   * Use different formulas depending on how discount is set
   * - if amount : Taxed Total - Discount Amount
   * - if percent: Taxed Total * (1 - Discount Percent / 100)
   */
  const taxedTotal = getTaxedTotalBeforeDiscounting(
    totalTaxRate,
    rate,
    quantity
  );

  if (fieldname === 'itemDiscountAmount') {
    return taxedTotal.sub(itemDiscountAmount);
  }

  return taxedTotal.mul(1 - itemDiscountPercent / 100);
}

function getTaxedTotalBeforeDiscounting(
  totalTaxRate: number,
  rate: Money,
  quantity: number
) {
  /**
   * If Discount is applied after taxation
   * Formula: Rate * Quantity * (1 + Total Tax Rate / 100)
   */

  return rate.mul(quantity).mul(1 + totalTaxRate / 100);
}
