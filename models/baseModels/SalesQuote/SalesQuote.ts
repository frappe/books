import { Fyo } from 'fyo';
import { Action, ListViewSettings } from 'fyo/model/types';
import { LedgerPosting } from 'models/Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';
import { getQuoteActions, getTransactionStatusColumn } from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesQuoteItem } from '../SalesQuoteItem/SalesQuoteItem';

export class SalesQuote extends Invoice {
  items?: SalesQuoteItem[];

  async getPosting() {
    return null;
  }

  async getInvoice(): Promise<Invoice | null> {
    if (!this.isSubmitted) {
      return null;
    }

    const schemaName = ModelNameEnum.SalesInvoice;
    const defaults = (this.fyo.singles.Defaults as Defaults) ?? {};
    const terms = defaults.salesInvoiceTerms ?? '';
    const numberSeries = defaults.salesInvoiceNumberSeries ?? undefined;

    const data = {
      ...this,
      date: new Date().toISOString(),
      terms,
      numberSeries,
      quote: this.name,
      items: []
    };

    const invoice = this.fyo.doc.getNewDoc(schemaName, data) as Invoice;
    for (const row of this.items ?? []) {
      await invoice.append('items', {
        ...row
      });
    }

    if (!invoice.items?.length) {
      return null;
    }

    return invoice;
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
    return getQuoteActions(fyo, ModelNameEnum.SalesQuote);
  }
}
