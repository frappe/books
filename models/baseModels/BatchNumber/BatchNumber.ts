import { Doc } from 'fyo/model/doc';
import {
  ListViewSettings,
} from 'fyo/model/types';

export class BatchNumber extends Doc {
  static getListViewSettings(): ListViewSettings {
    return {
      columns: ["name", "expiryDate", "manufactureDate"],
    };
  }

}
