import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { getInvoiceActions, getTransactionStatusColumn } from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { PurchaseInvoiceItem } from '../PurchaseInvoiceItem/PurchaseInvoiceItem';
import { createBatch } from 'models/inventory/helpers';

export class PurchaseInvoice extends Invoice {
  items?: PurchaseInvoiceItem[];

  async beforeSubmit(): Promise<void> {
    await super.beforeSubmit();

    if (this.isReturn) {
      return;
    }

    const batchesToCreate: { item: string; batch: string }[] = [];

    for (const item of this.items ?? []) {
      if (!item.item || !item.batch) {
        continue;
      }

      const hasBatch = await this.fyo.getValue(
        ModelNameEnum.Item,
        item.item,
        'hasBatch'
      );

      if (hasBatch) {
        batchesToCreate.push({
          item: item.item,
          batch: item.batch,
        });
      }
    }

    for (const { item, batch } of batchesToCreate) {
      await createBatch(this.fyo, item, batch);
    }
  }

  async getPosting() {
    const exchangeRate = this.exchangeRate ?? 1;
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);
    if (this.isReturn) {
      await posting.debit(this.account!, this.baseGrandTotal!);
    } else {
      await posting.credit(this.account!, this.baseGrandTotal!);
    }

    for (const item of this.items!) {
      if (this.isReturn) {
        await posting.credit(item.account!, item.amount!.mul(exchangeRate));
        continue;
      }
      await posting.debit(item.account!, item.amount!.mul(exchangeRate));
    }

    if (this.taxes) {
      for (const tax of this.taxes) {
        if (this.isReturn) {
          await posting.credit(tax.account!, tax.amount!.mul(exchangeRate));
          continue;
        }
        await posting.debit(tax.account!, tax.amount!.mul(exchangeRate));
      }
    }

    const discountAmount = this.getTotalDiscount();
    const discountAccount = this.fyo.singles.AccountingSettings
      ?.discountAccount as string | undefined;
    if (discountAccount && discountAmount.isPositive()) {
      if (this.isReturn) {
        await posting.debit(discountAccount, discountAmount.mul(exchangeRate));
      } else {
        await posting.credit(discountAccount, discountAmount.mul(exchangeRate));
      }
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
        'baseGrandTotal',
        'outstandingAmount',
      ],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    return getInvoiceActions(fyo, ModelNameEnum.PurchaseInvoice);
  }
}
