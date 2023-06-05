import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import {
  getStockTransferActions,
  getTransactionStatusColumn,
} from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { ShipmentItem } from './ShipmentItem';
import { StockTransfer } from './StockTransfer';

export class Shipment extends StockTransfer {
  items?: ShipmentItem[];

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

  static getActions(fyo: Fyo): Action[] {
    return getStockTransferActions(fyo, ModelNameEnum.Shipment);
  }
}
