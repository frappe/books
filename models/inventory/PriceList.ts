import { Doc } from 'fyo/model/doc';
import {
  ListViewSettings,
} from 'fyo/model/types';

export class PriceList extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ["name", "enabled"],
    };
  }

}
