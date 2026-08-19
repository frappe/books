import Account from './app/Account.json';
import AccountingLedgerEntry from './app/AccountingLedgerEntry.json';
import AccountingSettings from './app/AccountingSettings.json';
import Address from './app/Address.json';
import Batch from './app/Batch.json';
import Color from './app/Color.json';
import Currency from './app/Currency.json';
import Defaults from './app/Defaults.json';
import GetStarted from './app/GetStarted.json';
import Invoice from './app/Invoice.json';
import InvoiceItem from './app/InvoiceItem.json';
import Item from './app/Item.json';
import JournalEntry from './app/JournalEntry.json';
import JournalEntryAccount from './app/JournalEntryAccount.json';
import Misc from './app/Misc.json';
import NumberSeries from './app/NumberSeries.json';
import Party from './app/Party.json';
import Lead from './app/Lead.json';
import LoyaltyProgram from './app/LoyaltyProgram.json';
import LoyaltyPointEntry from './app/LoyaltyPointEntry.json';
import CollectionRulesItems from './app/CollectionRulesItems.json';
import CouponCode from './app/CouponCode.json';
import AppliedCouponCodes from './app/AppliedCouponCodes.json';
import Payment from './app/Payment.json';
import PaymentMethod from './app/PaymentMethod.json';
import PaymentFor from './app/PaymentFor.json';
import PriceList from './app/PriceList.json';
import PriceListItem from './app/PriceListItem.json';
import PricingRule from './app/PricingRule.json';
import PricingRuleItem from './app/PricingRuleItem.json';
import PricingRuleDetail from './app/PricingRuleDetail.json';
import PrintSettings from './app/PrintSettings.json';
import PrintTemplate from './app/PrintTemplate.json';
import PurchaseInvoice from './app/PurchaseInvoice.json';
import PurchaseInvoiceItem from './app/PurchaseInvoiceItem.json';
import SalesInvoice from './app/SalesInvoice.json';
import SalesInvoiceItem from './app/SalesInvoiceItem.json';
import SalesQuote from './app/SalesQuote.json';
import SalesQuoteItem from './app/SalesQuoteItem.json';
import SetupWizard from './app/SetupWizard.json';
import Tax from './app/Tax.json';
import TaxDetail from './app/TaxDetail.json';
import TaxSummary from './app/TaxSummary.json';
import UOM from './app/UOM.json';
import InventorySettings from './app/inventory/InventorySettings.json';
import Location from './app/inventory/Location.json';
import PurchaseReceipt from './app/inventory/PurchaseReceipt.json';
import PurchaseReceiptItem from './app/inventory/PurchaseReceiptItem.json';
import SerialNumber from './app/inventory/SerialNumber.json';
import Shipment from './app/inventory/Shipment.json';
import ShipmentItem from './app/inventory/ShipmentItem.json';
import StockLedgerEntry from './app/inventory/StockLedgerEntry.json';
import StockMovement from './app/inventory/StockMovement.json';
import StockMovementItem from './app/inventory/StockMovementItem.json';
import StockTransfer from './app/inventory/StockTransfer.json';
import StockTransferItem from './app/inventory/StockTransferItem.json';
import UOMConversionItem from './app/inventory/UOMConversionItem.json';
import CustomField from './core/CustomField.json';
import CustomForm from './core/CustomForm.json';
import PatchRun from './core/PatchRun.json';
import SingleValue from './core/SingleValue.json';
import SystemSettings from './core/SystemSettings.json';
import base from './meta/base.json';
import child from './meta/child.json';
import submittable from './meta/submittable.json';
import tree from './meta/tree.json';
import CashDenominations from './app/inventory/Point of Sale/CashDenominations.json';
import ClosingAmounts from './app/inventory/Point of Sale/ClosingAmounts.json';
import ClosingCash from './app/inventory/Point of Sale/ClosingCash.json';
import DefaultCashDenominations from './app/inventory/Point of Sale/DefaultCashDenominations.json';
import OpeningAmounts from './app/inventory/Point of Sale/OpeningAmounts.json';
import OpeningCash from './app/inventory/Point of Sale/OpeningCash.json';
import POSSettings from './app/inventory/Point of Sale/POSSettings.json';
import POSProfile from './app/POSProfile.json';
import POSOpeningShift from './app/inventory/Point of Sale/POSOpeningShift.json';
import POSClosingShift from './app/inventory/Point of Sale/POSClosingShift.json';
import POSShiftAmounts from './app/inventory/Point of Sale/POSShiftAmounts.json';
import ERPNextSyncSettings from './app/ERPNextSyncSettings.json';
import ERPNextSyncQueue from './app/ERPNextSyncQueue.json';
import FetchFromERPNextQueue from './app/FetchFromERPNextQueue.json';
import IntegrationErrorLog from './app/IntegrationErrorLog.json';
import ItemGroup from './app/ItemGroup.json';
import { Schema, SchemaStub } from './types';
import ItemEnquiry from './app/ItemEnquiry.json';

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
  Lead as Schema,
  Address as Schema,
  ItemGroup as Schema,
  Item as Schema,
  UOM as Schema,
  UOMConversionItem as Schema,

  LoyaltyProgram as Schema,
  LoyaltyPointEntry as Schema,
  CollectionRulesItems as Schema,

  Payment as Schema,
  PaymentMethod as Schema,
  PaymentFor as Schema,

  JournalEntry as Schema,
  JournalEntryAccount as Schema,

  Invoice as Schema,
  ItemEnquiry as Schema,
  SalesInvoice as Schema,
  PurchaseInvoice as Schema,
  SalesQuote as Schema,

  InvoiceItem as Schema,
  SalesInvoiceItem as SchemaStub,
  PurchaseInvoiceItem as SchemaStub,
  SalesQuoteItem as SchemaStub,
  CouponCode as Schema,
  AppliedCouponCodes as Schema,

  PriceList as Schema,
  PriceListItem as SchemaStub,

  PricingRule as Schema,
  PricingRuleItem as SchemaStub,
  PricingRuleDetail as SchemaStub,

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
  SerialNumber as Schema,

  CustomForm as Schema,
  CustomField as Schema,

  CashDenominations as Schema,
  ClosingAmounts as Schema,
  ClosingCash as Schema,
  DefaultCashDenominations as Schema,
  OpeningAmounts as Schema,
  OpeningCash as Schema,
  POSSettings as Schema,
  POSProfile as Schema,
  POSOpeningShift as Schema,
  POSClosingShift as Schema,
  POSShiftAmounts as Schema,

  ERPNextSyncSettings as Schema,
  ERPNextSyncQueue as Schema,
  FetchFromERPNextQueue as Schema,

  IntegrationErrorLog as Schema,
];
