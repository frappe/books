import { Doc } from 'fyo/model/doc';
import {
  FiltersMap,
  FormulaMap,
  ReadOnlyMap,
  RequiredMap,
} from 'fyo/model/types';
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
  batchNumber?: string;

  get isIssue() {
    return this.parentdoc?.movementType === MovementType.MaterialIssue;
  }

  get isReceipt() {
    return this.parentdoc?.movementType === MovementType.MaterialReceipt;
  }

  get isTransfer() {
    return this.parentdoc?.movementType === MovementType.MaterialTransfer;
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
      formula: (fn) => {
        if (this.isReceipt || this.isTransfer) {
          return null;
        }

        const defaultLocation = this.fyo.singles.InventorySettings
          ?.defaultLocation as string | undefined;
        if (defaultLocation && !this.location && this.isIssue) {
          return defaultLocation;
        }

        return this.toLocation;
      },
      dependsOn: ['movementType'],
    },
    toLocation: {
      formula: (fn) => {
        if (this.isIssue || this.isTransfer) {
          return null;
        }

        const defaultLocation = this.fyo.singles.InventorySettings
          ?.defaultLocation as string | undefined;
        if (defaultLocation && !this.location && this.isReceipt) {
          return defaultLocation;
        }

        return this.toLocation;
      },
      dependsOn: ['movementType'],
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
