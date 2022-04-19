import { LedgerPosting } from 'models/ledgerPosting/ledgerPosting';
import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import {
  getTransactionActions,
  getTransactionStatusColumn,
} from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { PurchaseInvoiceItem } from '../PurchaseInvoiceItem/PurchaseInvoiceItem';

export class PurchaseInvoice extends Invoice {
  items?: PurchaseInvoiceItem[];

  async getPosting() {
    const entries: LedgerPosting = new LedgerPosting(
      {
        reference: this,
        party: this.party,
      },
      this.fyo
    );

    await entries.credit(this.account!, this.baseGrandTotal!);

    for (const item of this.items!) {
      await entries.debit(item.account!, item.baseAmount!);
    }

    if (this.taxes) {
      for (const tax of this.taxes) {
        await entries.debit(tax.account!, tax.baseAmount!);
      }
    }

    entries.makeRoundOffEntry();
    return entries;
  }

  static getActions(fyo: Fyo): Action[] {
    return getTransactionActions('PurchaseInvoice', fyo);
  }

  static getListViewSettings(fyo: Fyo): ListViewSettings {
    return {
      formRoute: (name) => `/edit/PurchaseInvoice/${name}`,
      columns: [
        'party',
        'name',
        getTransactionStatusColumn(fyo),
        'date',
        'grandTotal',
        'outstandingAmount',
      ],
    };
  }
}
