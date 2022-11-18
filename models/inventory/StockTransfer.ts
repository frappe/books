import { t } from 'fyo';
import { Attachment } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { DefaultMap, FiltersMap, FormulaMap } from 'fyo/model/types';
import { NotFoundError, ValidationError } from 'fyo/utils/errors';
import { Defaults } from 'models/baseModels/Defaults/Defaults';
import { getNumberSeries } from 'models/helpers';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { StockTransferItem } from './StockTransferItem';
import { Transfer } from './Transfer';

export abstract class StockTransfer extends Transfer {
  name?: string;
  date?: Date;
  party?: string;
  terms?: string;
  attachment?: Attachment;
  grandTotal?: Money;
  items?: StockTransferItem[];

  get isSales() {
    return this.schemaName === ModelNameEnum.Shipment;
  }

  formulas: FormulaMap = {
    grandTotal: {
      formula: () => this.getSum('items', 'amount', false),
      dependsOn: ['items'],
    },
  };

  static defaults: DefaultMap = {
    numberSeries: (doc) => getNumberSeries(doc.schemaName, doc.fyo),
    terms: (doc) => {
      const defaults = doc.fyo.singles.Defaults as Defaults | undefined;
      if (doc.schemaName === ModelNameEnum.Shipment) {
        return defaults?.shipmentTerms ?? '';
      }

      return defaults?.purchaseReceiptTerms ?? '';
    },
    date: () => new Date().toISOString().slice(0, 10),
  };

  static filters: FiltersMap = {
    party: (doc: Doc) => ({
      role: ['in', [doc.isSales ? 'Customer' : 'Supplier', 'Both']],
    }),
    numberSeries: (doc: Doc) => ({ referenceType: doc.schemaName }),
  };

  override _getTransferDetails() {
    return (this.items ?? []).map((row) => {
      let fromLocation = undefined;
      let toLocation = undefined;

      if (this.isSales) {
        fromLocation = row.location;
      } else {
        toLocation = row.location;
      }

      return {
        item: row.item!,
        rate: row.rate!,
        quantity: row.quantity!,
        fromLocation,
        toLocation,
      };
    });
  }

  override async getPosting(): Promise<LedgerPosting | null> {
    await this.validateAccounts();
    const stockInHand = (await this.fyo.getValue(
      ModelNameEnum.InventorySettings,
      'stockInHand'
    )) as string;

    const amount = this.grandTotal ?? this.fyo.pesa(0);
    const posting = new LedgerPosting(this, this.fyo);

    if (this.isSales) {
      const costOfGoodsSold = (await this.fyo.getValue(
        ModelNameEnum.InventorySettings,
        'costOfGoodsSold'
      )) as string;

      await posting.debit(costOfGoodsSold, amount);
      await posting.credit(stockInHand, amount);
    } else {
      const stockReceivedButNotBilled = (await this.fyo.getValue(
        ModelNameEnum.InventorySettings,
        'stockReceivedButNotBilled'
      )) as string;

      await posting.debit(stockInHand, amount);
      await posting.credit(stockReceivedButNotBilled, amount);
    }

    await posting.makeRoundOffEntry()
    return posting;
  }

  async validateAccounts() {
    const settings: string[] = ['stockInHand'];
    if (this.isSales) {
      settings.push('costOfGoodsSold');
    } else {
      settings.push('stockReceivedButNotBilled');
    }

    const messages: string[] = [];
    for (const setting of settings) {
      const value = this.fyo.singles.InventorySettings?.[setting] as
        | string
        | undefined;
      const field = this.fyo.getField(ModelNameEnum.InventorySettings, setting);
      if (!value) {
        messages.push(t`${field.label} account not set in Inventory Settings.`);
        continue;
      }

      const exists = await this.fyo.db.exists(ModelNameEnum.Account, value);
      if (!exists) {
        messages.push(t`Account ${value} does not exist.`);
      }
    }

    if (messages.length) {
      throw new ValidationError(messages.join(' '));
    }
  }
}
