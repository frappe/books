import { ListViewSettings } from 'fyo/model/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { ShipmentItem } from './ShipmentItem';
import { StockTransfer } from './StockTransfer';

export class Shipment extends StockTransfer {
  items?: ShipmentItem[];

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: (name) => `/edit/Shipment/${name}`,
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'grandTotal',
      ],
    };
  }
}
