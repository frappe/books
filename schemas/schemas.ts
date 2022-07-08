import Account from './app/Account.json';
import AccountingLedgerEntry from './app/AccountingLedgerEntry.json';
import AccountingSettings from './app/AccountingSettings.json';
import Address from './app/Address.json';
import Color from './app/Color.json';
import CompanySettings from './app/CompanySettings.json';
import Currency from './app/Currency.json';
import GetStarted from './app/GetStarted.json';
import Item from './app/Item.json';
import JournalEntry from './app/JournalEntry.json';
import JournalEntryAccount from './app/JournalEntryAccount.json';
import NumberSeries from './app/NumberSeries.json';
import Party from './app/Party.json';
import Payment from './app/Payment.json';
import PaymentFor from './app/PaymentFor.json';
import PrintSettings from './app/PrintSettings.json';
import PurchaseInvoice from './app/PurchaseInvoice.json';
import PurchaseInvoiceItem from './app/PurchaseInvoiceItem.json';
import SalesInvoice from './app/SalesInvoice.json';
import SalesInvoiceItem from './app/SalesInvoiceItem.json';
import SetupWizard from './app/SetupWizard.json';
import Tax from './app/Tax.json';
import TaxDetail from './app/TaxDetail.json';
import TaxSummary from './app/TaxSummary.json';
import UOM from './app/UOM.json';
import PatchRun from './core/PatchRun.json';
import SingleValue from './core/SingleValue.json';
import SystemSettings from './core/SystemSettings.json';
import base from './meta/base.json';
import child from './meta/child.json';
import submittable from './meta/submittable.json';
import tree from './meta/tree.json';
import { Schema, SchemaStub } from './types';

export const coreSchemas: Schema[] = [
  PatchRun as Schema,
  SingleValue as Schema,
  SystemSettings as Schema,
];

export const metaSchemas: SchemaStub[] = [
  base as SchemaStub,
  child as SchemaStub,
  submittable as SchemaStub,
  tree as SchemaStub,
];

export const appSchemas: Schema[] | SchemaStub[] = [
  SetupWizard as Schema,
  GetStarted as Schema,

  Color as Schema,
  Currency as Schema,
  NumberSeries as Schema,

  PrintSettings as Schema,
  CompanySettings as Schema,

  Account as Schema,
  AccountingSettings as Schema,
  AccountingLedgerEntry as Schema,

  Party as Schema,
  Address as Schema,
  Item as Schema,
  UOM as Schema,

  Payment as Schema,
  PaymentFor as Schema,

  JournalEntry as Schema,
  JournalEntryAccount as Schema,

  PurchaseInvoice as Schema,
  PurchaseInvoiceItem as Schema,

  SalesInvoice as Schema,
  SalesInvoiceItem as Schema,

  Tax as Schema,
  TaxDetail as Schema,
  TaxSummary as Schema,
];
