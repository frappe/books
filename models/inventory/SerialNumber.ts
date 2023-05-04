import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { getSerialNumberStatusColumn } from 'models/helpers';
import { SerialNumberStatus } from './types';

export class SerialNumber extends Doc {
  name?: string;
  item?: string;
  description?: string;
  status?: SerialNumberStatus;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        getSerialNumberStatusColumn(),
        'item',
        'description',
        'party',
      ],
    };
  }
}
