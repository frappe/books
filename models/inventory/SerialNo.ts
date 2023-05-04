import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { getSerialNoStatusColumn } from 'models/helpers';

export class SerialNo extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        getSerialNoStatusColumn(),
        'item',
        'description',
        'party',
      ],
    };
  }
}