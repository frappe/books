import Account from './app/Account.json';
import AccountingLedgerEntry from './app/AccountingLedgerEntry.json';
import AccountingSettings from './app/AccountingSettings.json';
import Address from './app/Address.json';
import Batch from './app/Batch.json';
import Color from './app/Color.json';
import Currency from './app/Currency.json';
import Defaults from './app/Defaults.json';
import GetStarted from './app/GetStarted.json';
import InventorySettings from './app/inventory/InventorySettings.json';
import Location from './app/inventory/Location.json';
import PurchaseReceipt from './app/inventory/PurchaseReceipt.json';
import PurchaseReceiptItem from './app/inventory/PurchaseReceiptItem.json';
import Shipment from './app/inventory/Shipment.json';
import ShipmentItem from './app/inventory/ShipmentItem.json';
import StockLedgerEntry from './app/inventory/StockLedgerEntry.json';
import StockMovement from './app/inventory/StockMovement.json';
import StockMovementItem from './app/inventory/StockMovementItem.json';
import StockTransfer from './app/inventory/StockTransfer.json';
import StockTransferItem from './app/inventory/StockTransferItem.json';
import UOMConversionItem from './app/inventory/UOMConversionItem.json';
import Invoice from './app/Invoice.json';
import InvoiceItem from './app/InvoiceItem.json';
import Item from './app/Item.json';
import JournalEntry from './app/JournalEntry.json';
import JournalEntryAccount from './app/JournalEntryAccount.json';
import Misc from './app/Misc.json';
import NumberSeries from './app/NumberSeries.json';
import Party from './app/Party.json';
import Payment from './app/Payment.json';
import PaymentFor from './app/PaymentFor.json';
import PrintSettings from './app/PrintSettings.json';
import PrintTemplate from './app/PrintTemplate.json';
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
  Misc as Schema,
  SetupWizard as Schema,
  GetStarted as Schema,
  PrintTemplate as Schema,

  Color as Schema,
  Currency as Schema,
  Defaults as Schema,
  NumberSeries as Schema,

  PrintSettings as Schema,

  Account as Schema,
  AccountingSettings as Schema,
  AccountingLedgerEntry as Schema,

  Party as Schema,
  Address as Schema,
  Item as Schema,
  UOM as Schema,
  UOMConversionItem as Schema,

  Payment as Schema,
  PaymentFor as Schema,

  JournalEntry as Schema,
  JournalEntryAccount as Schema,

  Invoice as Schema,
  SalesInvoice as Schema,
  PurchaseInvoice as Schema,

  InvoiceItem as Schema,
  SalesInvoiceItem as SchemaStub,
  PurchaseInvoiceItem as SchemaStub,

  Tax as Schema,
  TaxDetail as Schema,
  TaxSummary as Schema,

  InventorySettings as Schema,
  Location as Schema,
  StockLedgerEntry as Schema,
  StockMovement as Schema,
  StockMovementItem as Schema,

  StockTransfer as Schema,
  StockTransferItem as Schema,
  Shipment as Schema,
  ShipmentItem as Schema,
  PurchaseReceipt as Schema,
  PurchaseReceiptItem as Schema,

  Batch as Schema,
];
