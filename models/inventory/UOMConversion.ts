import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class UOMConversion extends Doc {
  toUOM?: string;
  fromUOM?: string;
  conversionFactor?: number;
  
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['fromUOM', 'toUOM', 'conversionFactor'],
    };
  }
}
