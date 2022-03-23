import Account from '../../../models/doctype/Account/AccountList';
import AccountingLedgerEntry from '../../../models/doctype/AccountingLedgerEntry/AccountingLedgerEntryList';
import Item from '../../../models/doctype/Item/ItemList';
import JournalEntry from '../../../models/doctype/JournalEntry/JournalEntryList';
import Customer from '../../../models/doctype/Party/CustomerList';
import Party from '../../../models/doctype/Party/PartyList';
import Supplier from '../../../models/doctype/Party/SupplierList';
import Payment from '../../../models/doctype/Payment/PaymentList';
import PurchaseInvoice from '../../../models/doctype/PurchaseInvoice/PurchaseInvoiceList';
import SalesInvoice from '../../../models/doctype/SalesInvoice/SalesInvoiceList';
import Tax from '../../../models/doctype/Tax/TaxList';

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
  AccountingLedgerEntry,
};
