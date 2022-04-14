import { LedgerPosting } from 'accounting/ledgerPosting';
import { Action, ListViewSettings } from 'frappe/model/types';
import {
  getTransactionActions,
  getTransactionStatusColumn,
} from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';

export class SalesInvoice extends Invoice {
  items?: SalesInvoiceItem[];

  async getPosting() {
    const entries: LedgerPosting = new LedgerPosting({
      reference: this,
      party: this.party,
    });
    await entries.debit(this.account!, this.baseGrandTotal!);

    for (const item of this.items!) {
      await entries.credit(item.account!, item.baseAmount!);
    }

    if (this.taxes) {
      for (const tax of this.taxes!) {
        await entries.credit(tax.account!, tax.baseAmount!);
      }
    }
    entries.makeRoundOffEntry();
    return entries;
  }

  static actions: Action[] = getTransactionActions('SalesInvoice');

  static listSettings: ListViewSettings = {
    formRoute: (name) => `/edit/SalesInvoice/${name}`,
    columns: [
      'party',
      'name',
      getTransactionStatusColumn(),
      'date',
      'grandTotal',
      'outstandingAmount',
    ],
  };
}
