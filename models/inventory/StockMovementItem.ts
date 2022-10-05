import { Doc } from 'fyo/model/doc';
import { FilterFunction, FiltersMap } from 'fyo/model/types';
import { Money } from 'pesa';
import { QueryFilter } from 'utils/db/types';

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

  static filters: FiltersMap = {
    item: () => ({ trackItem: true }),
    toLocation: locationFilter,
    fromLocation: locationFilter,
  };
}
