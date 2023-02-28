import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  FiltersMap,
  FormulaMap,
  HiddenMap,
  ReadOnlyMap,
  RequiredMap,
  ValidationMap,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { safeParseFloat } from 'utils/index';
import { StockMovement } from './StockMovement';
import { MovementType } from './types';

export class StockMovementItem extends Doc {
  name?: string;
  item?: string;
  fromLocation?: string;
  toLocation?: string;

  unit?: string;
  transferUnit?: string;
  quantity?: number;
  transferQuantity?: number;
  unitConversionFactor?: number;

  rate?: Money;
  amount?: Money;
  parentdoc?: StockMovement;
  batch?: string;

  get isIssue() {
    return this.parentdoc?.movementType === MovementType.MaterialIssue;
  }

  get isReceipt() {
    return this.parentdoc?.movementType === MovementType.MaterialReceipt;
  }

  get isTransfer() {
    return this.parentdoc?.movementType === MovementType.MaterialTransfer;
  }

  get isManufacture() {
    return this.parentdoc?.movementType === MovementType.Manufacture;
  }

  static filters: FiltersMap = {
    item: () => ({ trackItem: true }),
  };

  formulas: FormulaMap = {
    rate: {
      formula: async () => {
        if (!this.item) {
          return this.rate;
        }

        return await this.fyo.getValue(ModelNameEnum.Item, this.item, 'rate');
      },
      dependsOn: ['item'],
    },
    amount: {
      formula: () => this.rate!.mul(this.quantity!),
      dependsOn: ['item', 'rate', 'quantity'],
    },
    fromLocation: {
      formula: () => {
        if (this.isReceipt || this.isTransfer || this.isManufacture) {
          return null;
        }

        const defaultLocation = this.fyo.singles.InventorySettings
          ?.defaultLocation as string | undefined;
        if (defaultLocation && !this.fromLocation && this.isIssue) {
          return defaultLocation;
        }

        return this.toLocation;
      },
      dependsOn: ['movementType'],
    },
    toLocation: {
      formula: () => {
        if (this.isIssue || this.isTransfer || this.isManufacture) {
          return null;
        }

        const defaultLocation = this.fyo.singles.InventorySettings
          ?.defaultLocation as string | undefined;
        if (defaultLocation && !this.toLocation && this.isReceipt) {
          return defaultLocation;
        }

        return this.toLocation;
      },
      dependsOn: ['movementType'],
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
    transferUnit: {
      formula: async (fieldname) => {
        if (fieldname === 'quantity' || fieldname === 'unit') {
          return this.unit;
        }

        return (await this.fyo.getValue(
          'Item',
          this.item as string,
          'unit'
        )) as string;
      },
      dependsOn: ['item', 'unit'],
    },
    transferQuantity: {
      formula: async (fieldname) => {
        if (fieldname === 'quantity' || this.unit === this.transferUnit) {
          return this.quantity;
        }

        return this.transferQuantity;
      },
      dependsOn: ['item', 'quantity'],
    },
    quantity: {
      formula: async (fieldname) => {
        if (!this.item) {
          return this.quantity as number;
        }

        const itemDoc = await this.fyo.doc.getDoc(
          ModelNameEnum.Item,
          this.item as string
        );
        const unitDoc = itemDoc.getLink('uom');

        let quantity: number = this.quantity ?? 1;
        if (fieldname === 'transferQuantity') {
          quantity = this.transferQuantity! * this.unitConversionFactor!;
        }

        if (unitDoc?.isWhole) {
          return Math.round(quantity);
        }

        return safeParseFloat(quantity);
      },
      dependsOn: [
        'quantity',
        'transferQuantity',
        'transferUnit',
        'unitConversionFactor',
      ],
    },
    unitConversionFactor: {
      formula: async () => {
        if (this.unit === this.transferUnit) {
          return 1;
        }

        const conversionFactor = await this.fyo.db.getAll(
          ModelNameEnum.UOMConversionItem,
          {
            fields: ['conversionFactor'],
            filters: { parent: this.item! },
          }
        );

        return safeParseFloat(conversionFactor[0]?.conversionFactor ?? 1);
      },
      dependsOn: ['transferUnit'],
    },
  };

  validations: ValidationMap = {
    fromLocation: (value) => {
      if (!this.isManufacture) {
        return;
      }

      if (value && this.toLocation) {
        throw new ValidationError(
          this.fyo.t`Only From or To can be set for Manufacture`
        );
      }
    },
    toLocation: (value) => {
      if (!this.isManufacture) {
        return;
      }

      if (value && this.fromLocation) {
        throw new ValidationError(
          this.fyo.t`Only From or To can be set for Manufacture`
        );
      }
    },
    transferUnit: async (value: DocValue) => {
      if (!this.item) {
        return;
      }

      const item = await this.fyo.db.getAll(ModelNameEnum.UOMConversionItem, {
        fields: ['parent'],
        filters: { uom: value as string, parent: this.item! },
      });

      if (item.length < 1)
        throw new ValidationError(
          t`Transfer Unit ${value as string} is not applicable for Item ${this
            .item!}`
        );
    },
  };

  required: RequiredMap = {
    fromLocation: () => this.isIssue || this.isTransfer,
    toLocation: () => this.isReceipt || this.isTransfer,
  };

  readOnly: ReadOnlyMap = {
    fromLocation: () => this.isReceipt,
    toLocation: () => this.isIssue,
  };

  override hidden: HiddenMap = {
    batch: () => !this.fyo.singles.InventorySettings?.enableBatches,
    transferUnit: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
    transferQuantity: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
    unitConversionFactor: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
  };

  static createFilters: FiltersMap = {
    item: () => ({ trackItem: true, itemType: 'Product' }),
  };
}
