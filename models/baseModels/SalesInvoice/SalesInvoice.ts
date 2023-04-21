import { Fyo } from 'fyo';
import { Action, HiddenMap, ListViewSettings, ReadOnlyMap } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { getInvoiceActions, getTransactionStatusColumn } from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';

export class SalesInvoice extends Invoice {
  items?: SalesInvoiceItem[];
  isReturn?: boolean;

  async getPosting() {
    const exchangeRate = this.exchangeRate ?? 1;
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);

    if (this.isReturn) {
      if (!this.outstandingAmount?.isZero) {
        await posting.debit(this.account!, this.baseGrandTotal?.mul(-1)!);
      }
      await posting.credit(this.account!, this.baseGrandTotal?.mul(-1)!);
    } else {
      await posting.debit(this.account!, this.baseGrandTotal!);
    }

    for (const item of this.items!) {
      if (this.isReturn) {
        await posting.debit(
          item.account!,
          item.amount!.mul(exchangeRate).mul(-1)
        );
      } else {
        await posting.credit(item.account!, item.amount!.mul(exchangeRate));
      }
    }

    if (this.taxes) {
      for (const tax of this.taxes!) {
        await posting.credit(tax.account!, tax.amount!.mul(exchangeRate));
      }
    }

    const discountAmount = await this.getTotalDiscount();
    const discountAccount = this.fyo.singles.AccountingSettings
      ?.discountAccount as string | undefined;
    if (discountAccount && discountAmount.isPositive()) {
      await posting.debit(discountAccount, discountAmount.mul(exchangeRate));
    }

    await posting.makeRoundOffEntry();
    return posting;
  }

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    if (this.isReturn) {
      this.fyo.db.update(ModelNameEnum.SalesInvoice, {
        name: this.returnAgainst as string,
        isCreditNoteIssued: true,
      });
    }
  }

  static hidden: HiddenMap = {
    isReturn: () => true,
  };

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: (name) => `/edit/SalesInvoice/${name}`,
      columns: [
        'name',
        getTransactionStatusColumn(),
        'party',
        'date',
        'isReturn',
        'baseGrandTotal',
        'outstandingAmount',
      ],
    };
  }

  static getActions(fyo: Fyo): Action[] {
    return getInvoiceActions(fyo, ModelNameEnum.SalesInvoice);
  }
}
