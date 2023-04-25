import { ListViewSettings } from 'fyo/model/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { updateSerialNoStatus } from './helpers';
import { ShipmentItem } from './ShipmentItem';
import { StockTransfer } from './StockTransfer';

export class Shipment extends StockTransfer {
  items?: ShipmentItem[];

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    await updateSerialNoStatus(this, this.items!, 'Delivered');
  }

  async afterCancel(): Promise<void> {
    await super.afterCancel();
    await updateSerialNoStatus(this, this.items!, 'Active');
  }

  static getListViewSettings(): ListViewSettings {
    return {
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
