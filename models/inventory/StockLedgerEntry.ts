import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { Money } from 'pesa';

export class StockLedgerEntry extends Doc {
  date?: Date;
  item?: string;
  rate?: Money;
  quantity?: number;
  location?: string;
  referenceName?: string;
  referenceType?: string;
  batch?: string;

  static override getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'date',
        'item',
        'location',
        'rate',
        'quantity',
        'referenceName',
      ],
    };
  }
}
