import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { getPriceListStatusColumn } from './helpers';

export class PriceList extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getPriceListStatusColumn()],
    };
  }
}
