import { ListViewSettings } from 'fyo/model/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { PurchaseReceiptItem } from './PurchaseReceiptItem';
import { StockTransfer } from './StockTransfer';

export class PurchaseReceipt extends StockTransfer {
  items?: PurchaseReceiptItem[];

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: (name) => `/edit/PurchaseReceipt/${name}`,
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
