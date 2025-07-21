import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class ItemEnquiry extends Doc {
  itemName!: string;
  customerName!: string;
  contact?: string;
  description?: string;
  similarProduct?: string;

  static override getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'itemName',
        'customerName',
        'contact',
        'description',
        'similarProduct',
      ],
    };
  }
}
