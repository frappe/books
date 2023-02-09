import { ListViewSettings } from 'fyo/model/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { ShipmentItem } from './ShipmentItem';
import { StockTransfer } from './StockTransfer';

export class Shipment extends StockTransfer {
  items?: ShipmentItem[];

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    for (const item of this.items!) {
      await this.fyo.db.update(ModelNameEnum.SerialNumber, {
        name: item.serialNumber,
        status: 'Delivered',
        party: this.party,
      });
    }
  }

  async afterDelete(): Promise<void> {
    await super.afterDelete();
    for (const item of this.items!) {
      await this.fyo.db.update(ModelNameEnum.SerialNumber, {
        name: item.serialNumber,
        status: 'Active',
      });
    }
  }

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: ({ name }) => `/edit/Shipment/${name}`,
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
