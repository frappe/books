import { Doc } from 'fyo/model/doc';
import {
  FiltersMap,
  FormulaMap,
  ReadOnlyMap,
  RequiredMap
} from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { locationFilter } from './helpers';
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

  static filters: FiltersMap = {
    item: () => ({ trackItem: true }),
    toLocation: locationFilter,
    fromLocation: locationFilter,
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
        if (this.parentdoc?.movementType === MovementType.MaterialReceipt) {
          return null;
        }
      },
    },
    toLocation: {
      formula: () => {
        if (this.parentdoc?.movementType === MovementType.MaterialIssue) {
          return null;
        }
      },
    },
  };

  required: RequiredMap = {
    fromLocation: () =>
      this.parentdoc?.movementType === 'MaterialIssue' ||
      this.parentdoc?.movementType === 'MaterialTransfer',
    toLocation: () =>
      this.parentdoc?.movementType === 'MaterialReceipt' ||
      this.parentdoc?.movementType === 'MaterialTransfer',
  };

  readOnly: ReadOnlyMap = {
    fromLocation: () =>
      this.parentdoc?.movementType === MovementType.MaterialReceipt,
    toLocation: () =>
      this.parentdoc?.movementType === MovementType.MaterialIssue,
  };

  static createFilters: FiltersMap = {
    item: () => ({ trackItem: true, itemType: 'Product' }),
    fromLocation: (doc: Doc) => ({ item: (doc.item ?? '') as string }),
    toLocation: (doc: Doc) => ({ item: (doc.item ?? '') as string }),
  };
}
