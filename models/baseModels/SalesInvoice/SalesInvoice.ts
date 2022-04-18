import { LedgerPosting } from 'accounting/ledgerPosting';
import { Frappe } from 'frappe';
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
    const entries: LedgerPosting = new LedgerPosting(
      {
        reference: this,
        party: this.party,
      },
      this.frappe
    );
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

  static getActions(frappe: Frappe): Action[] {
    return getTransactionActions('SalesInvoice', frappe);
  }

  static getListViewSettings(frappe: Frappe): ListViewSettings {
    return {
      formRoute: (name) => `/edit/SalesInvoice/${name}`,
      columns: [
        'party',
        'name',
        getTransactionStatusColumn(frappe),
        'date',
        'grandTotal',
        'outstandingAmount',
      ],
    };
  }
}
