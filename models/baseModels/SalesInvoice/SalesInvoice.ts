import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { getInvoiceActions, getTransactionStatusColumn } from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';

export class SalesInvoice extends Invoice {
  items?: SalesInvoiceItem[];

  async getPosting() {
    const exchangeRate = this.exchangeRate ?? 1;
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);
    await posting.debit(this.account!, this.baseGrandTotal!);

    for (const item of this.items!) {
      await posting.credit(item.account!, item.amount!.mul(exchangeRate));
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

  static getListViewSettings(): ListViewSettings {
    return {
      formRoute: (name) => `/edit/SalesInvoice/${name}`,
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
    return getInvoiceActions(fyo, ModelNameEnum.SalesInvoice);
  }
}
