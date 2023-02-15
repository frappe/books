import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  FiltersMap,
  FormulaMap,
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
  quantity?: number;
  transferQty?: number;
  stockUOM?: string;
  uom?: string;
  UOMConversionFactor?: number;
  rate?: Money;
  amount?: Money;
  parentdoc?: StockMovement;

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
  };

  validations: ValidationMap = {
    fromLocation: (value) => {
      if (!this.isManufacture) {
        return;
      }

      if (value && this.toLocation) {
        throw new ValidationError(
          this.fyo.t`Only From or To can be set for Manucature`
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

  required: RequiredMap = {
    fromLocation: () => this.isIssue || this.isTransfer,
    toLocation: () => this.isReceipt || this.isTransfer,
  };

  readOnly: ReadOnlyMap = {
    fromLocation: () => this.isReceipt,
    toLocation: () => this.isIssue,
  };

  static createFilters: FiltersMap = {
    item: () => ({ trackItem: true, itemType: 'Product' }),
  };
}
