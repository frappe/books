import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';

export class StockTransferItem extends Doc {
  item?: string;
  location?: string;
  quantity?: number;
  rate?: Money;
  amount?: Money;
  unit?: string;
  description?: string;
  hsnCode?: number;
  serialNumber?: string;

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
    unit: {
      formula: async () =>
        (await this.fyo.getValue(
          'Item',
          this.item as string,
          'unit'
        )) as string,
      dependsOn: ['item'],
    },
    hsnCode: {
      formula: async () =>
        (await this.fyo.getValue(
          'Item',
          this.item as string,
          'hsnCode'
        )) as string,
      dependsOn: ['item'],
    },
    amount: {
      formula: () => {
        return this.rate?.mul(this.quantity ?? 0) ?? this.fyo.pesa(0);
      },
      dependsOn: ['rate', 'quantity'],
    },
    rate: {
      formula: async (fieldname) => {
        const rate = (await this.fyo.getValue(
          'Item',
          this.item as string,
          'rate'
        )) as undefined | Money;

        if (!rate?.float && this.rate?.float) {
          return this.rate;
        }

        return rate ?? this.fyo.pesa(0);
      },
      dependsOn: ['item'],
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
    location: {
      formula: () => {
        if (this.location) {
          return;
        }

        const defaultLocation = this.fyo.singles.InventorySettings
          ?.defaultLocation as string | undefined;

        if (defaultLocation && !this.location) {
          return defaultLocation;
        }
      },
    },
  };

  static filters: FiltersMap = {
    item: (doc: Doc) => {
      let itemNotFor = 'Sales';
      if (doc.isSales) {
        itemNotFor = 'Purchases';
      }

      return { for: ['not in', [itemNotFor]], trackItem: true };
    },
  };
}
