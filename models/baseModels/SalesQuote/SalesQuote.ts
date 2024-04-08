import { Fyo } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Action, ListViewSettings } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { getQuoteActions, getTransactionStatusColumn } from '../../helpers';
import { Invoice } from '../Invoice/Invoice';
import { SalesQuoteItem } from '../SalesQuoteItem/SalesQuoteItem';
import { Defaults } from '../Defaults/Defaults';

export class SalesQuote extends Invoice {
  items?: SalesQuoteItem[];

  // This is an inherited method and it must keep the async from the parent
  // class
  // eslint-disable-next-line @typescript-eslint/require-await
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

    const data: DocValueMap = {
      ...this.getValidDict(false, true),
      date: new Date().toISOString(),
      terms,
      numberSeries,
      quote: this.name,
      items: [],
    };

    const invoice = this.fyo.doc.getNewDoc(schemaName, data) as Invoice;
    for (const row of this.items ?? []) {
      await invoice.append('items', row.getValidDict(false, true));
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
