import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { ItemPrice } from '../ItemPrice/ItemPrice';
import { getPriceListStatusColumn } from 'models/helpers';

export class PriceList extends Doc {
  enabled?: boolean;
  buying?: boolean;
  selling?: boolean;
  isUomDependent?: boolean;
  priceListItem?: ItemPrice[];

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getPriceListStatusColumn()],
    };
  }
}
