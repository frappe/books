import { Doc } from 'fyo/model/doc';
import {
  FilterFunction,
  FiltersMap,
  FormulaMap,
  RequiredMap
} from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { QueryFilter } from 'utils/db/types';
import { StockMovement } from './StockMovement';

const locationFilter: FilterFunction = (doc: Doc) => {
  const item = doc.item;
  if (!doc.item) {
    return {};
  }

  return { item } as QueryFilter;
};

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
        console.log('called', this.item);
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
  };

  required: RequiredMap = {
    fromLocation: () =>
      this.parentdoc?.movementType === 'MaterialIssue' ||
      this.parentdoc?.movementType === 'MaterialTransfer',
    toLocation: () =>
      this.parentdoc?.movementType === 'MaterialReceipt' ||
      this.parentdoc?.movementType === 'MaterialTransfer',
  };

  static createFilters: FiltersMap = {
    item: () => ({ trackItem: true, itemType: 'Product' }),
    fromLocation: (doc: Doc) => ({ item: (doc.item ?? '') as string }),
    toLocation: (doc: Doc) => ({ item: (doc.item ?? '') as string }),
  };
}
