import { LedgerPosting } from 'accounting/ledgerPosting';
import { Frappe } from 'frappe';
import { Action, ListViewSettings } from 'frappe/model/types';
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
      this.frappe
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

  static getActions(frappe: Frappe): Action[] {
    return getTransactionActions('PurchaseInvoice', frappe);
  }

  static getListViewSettings(frappe: Frappe): ListViewSettings {
    return {
      formRoute: (name) => `/edit/PurchaseInvoice/${name}`,
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
