import {
  Action,
  FiltersMap,
  HiddenMap,
  ListViewSettings,
} from 'fyo/model/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { ShipmentItem } from './ShipmentItem';
import { StockTransfer } from './StockTransfer';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { Fyo } from 'fyo';
import {
  getShipmentActions,
  updateReturnCompleteStatus,
  validateHasLinkedReturnInvoices,
} from './helpers';

export class Shipment extends StockTransfer {
  items?: ShipmentItem[];
  isReturn?: boolean;
  returnAgainst?: string;

  async afterSubmit() {
    await super.afterSubmit();
    if (this.isReturn && this.returnAgainst) {
      await updateReturnCompleteStatus(this);
    }
  }

  async beforeCancel() {
    await super.beforeCancel();
    await validateHasLinkedReturnInvoices(this);
  }

  async afterCancel() {
    await super.afterCancel();
    await updateReturnCompleteStatus(this);
  }

  static filters: FiltersMap = {
    returnAgainst: () => ({
      submitted: true,
      isReturn: false,
      cancelled: false,
      returnCompleted: false,
    }),
  };

  override async getPosting(): Promise<LedgerPosting | null> {
    await this.validateAccounts();
    const stockInHand = (await this.fyo.getValue(
      ModelNameEnum.InventorySettings,
      'stockInHand'
    )) as string;

    const amount = this.grandTotal ?? this.fyo.pesa(0);
    const posting = new LedgerPosting(this, this.fyo);

    const costOfGoodsSold = (await this.fyo.getValue(
      ModelNameEnum.InventorySettings,
      'costOfGoodsSold'
    )) as string;

    if (this.isReturn) {
      await posting.debit(stockInHand, amount);
      await posting.credit(costOfGoodsSold, amount);
    } else {
      await posting.debit(costOfGoodsSold, amount);
      await posting.credit(stockInHand, amount);
    }

    await posting.makeRoundOffEntry();
    return posting;
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

  hidden: HiddenMap = {
    isReturn: () => !!this.submitted && !this.isReturn,
    returnAgainst: () => !this.isReturn,
  };

  static getActions(fyo: Fyo): Action[] {
    return getShipmentActions(fyo);
  }
}
