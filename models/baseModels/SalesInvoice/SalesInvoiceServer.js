import TransactionServer from '../Transaction/TransactionServer';
import SalesInvoice from './SalesInvoiceDocument';
import LedgerPosting from '../../../accounting/ledgerPosting';

class SalesInvoiceServer extends SalesInvoice {
  async getPosting() {
    let entries = new LedgerPosting({ reference: this, party: this.customer });
    await entries.debit(this.account, this.baseGrandTotal);

    for (let item of this.items) {
      await entries.credit(item.account, item.baseAmount);
    }

    if (this.taxes) {
      for (let tax of this.taxes) {
        await entries.credit(tax.account, tax.baseAmount);
      }
    }
    entries.makeRoundOffEntry();
    return entries;
  }
}

// apply common methods from TransactionServer
Object.assign(SalesInvoiceServer.prototype, TransactionServer);

export default SalesInvoiceServer;
