import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class Plugin extends Doc {
  name?: string;
  version?: string;
  info?: string;
  data?: string;

  /*
  override get canDelete(): boolean {
    return false;
  }
  */

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: (name) => `/plugin/${name}`,
      columns: ['name'],
    };
  }
}
