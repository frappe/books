import SalesInvoice from '../../../models/doctype/SalesInvoice/SalesInvoiceList';
import PurchaseInvoice from '../../../models/doctype/PurchaseInvoice/PurchaseInvoiceList';
import Customer from '../../../models/doctype/Party/CustomerList';
import Supplier from '../../../models/doctype/Party/SupplierList';
import Party from '../../../models/doctype/Party/PartyList';
import Item from '../../../models/doctype/Item/ItemList';
import Payment from '../../../models/doctype/Payment/PaymentList';
import Tax from '../../../models/doctype/Tax/TaxList';
import JournalEntry from '../../../models/doctype/JournalEntry/JournalEntryList';
import AccountingLedgerEntry from '../../../models/doctype/AccountingLedgerEntry/AccountingLedgerEntryList';
import Account from '../../../models/doctype/Account/AccountList';
import GSTR3B from '../../../models/doctype/GSTR3B/GSTR3BList';

export default {
  SalesInvoice,
  PurchaseInvoice,
  Customer,
  Supplier,
  Party,
  Item,
  Payment,
  Tax,
  JournalEntry,
  Account,
  GSTR3B,
  AccountingLedgerEntry
};
