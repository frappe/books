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
import { StockMovement } from './StockMovement';
import { MovementType } from './types';

export class StockMovementItem extends Doc {
  name?: string;
  item?: string;
  fromLocation?: string;
  toLocation?: string;
  quantity?: number;
  rate?: Money;
  amount?: Money;
  parentdoc?: StockMovement;
  serialNumber?: string;

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
