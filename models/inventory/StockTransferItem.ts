import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { FiltersMap, FormulaMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { safeParseFloat } from 'utils/index';

export class StockTransferItem extends Doc {
  item?: string;
  location?: string;
  quantity?: number;
  transferQty?: number;
  stockUOM?: string;
  uom?: string;
  UOMConversionFactor?: number;
  rate?: Money;
  amount?: Money;
  unit?: string;
  description?: string;
  hsnCode?: number;

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
    stockUOM: {
      formula: async () => {
        const { unit } = await this.fyo.db.get(
          ModelNameEnum.Item,
          this.item!,
          'unit'
        );
        return unit;
      },
      dependsOn: ['item'],
    },
    UOMConversionFactor: {
      formula: async () => {
        const conversionFactor = await this.fyo.db.getAll(
          ModelNameEnum.UOMConversionFactor,
          {
            fields: ['value'],
            filters: { parent: this.item! },
          }
        );
        return safeParseFloat(conversionFactor[0].value);
      },
      dependsOn: ['uom'],
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
        const unitDoc = itemDoc.getLink('uom');
        if (unitDoc?.isWhole) {
          return Math.round(this.transferQty! * this.UOMConversionFactor!);
        }

        return safeParseFloat(this.transferQty! * this.UOMConversionFactor!);
      },
      dependsOn: ['quantity', 'transferQty', 'UOMConversionFactor'],
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

  validations: ValidationMap = {
    uom: async (value: DocValue) => {
      const item = await this.fyo.db.getAll(ModelNameEnum.UOMConversionFactor, {
        fields: ['parent'],
        filters: { uom: value as string, parent: this.item! },
      });
      if (item.length < 1)
        throw new ValidationError(
          t`UOM ${value as string} is not applicable for item ${this.item!}`
        );
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
