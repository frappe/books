import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class ItemEnquiry extends Doc {
  item?: string;
  customer?: string;
  contact?: string;
  description?: string;
  similarProduct?: string;

  static override getListViewSettings(): ListViewSettings {
    return {
      columns: ['item', 'customer', 'contact', 'description', 'similarProduct'],
    };
  }
}
