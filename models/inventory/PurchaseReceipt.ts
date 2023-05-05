import { ListViewSettings } from 'fyo/model/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { PurchaseReceiptItem } from './PurchaseReceiptItem';
import { StockTransfer } from './StockTransfer';
import { createSerialNumbers } from './helpers';

export class PurchaseReceipt extends StockTransfer {
  items?: PurchaseReceiptItem[];

  override async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    await createSerialNumbers(this);
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
