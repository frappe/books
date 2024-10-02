import { ModelMap } from 'fyo/model/types';
import { Account } from './baseModels/Account/Account';
import { AccountingLedgerEntry } from './baseModels/AccountingLedgerEntry/AccountingLedgerEntry';
import { AccountingSettings } from './baseModels/AccountingSettings/AccountingSettings';
import { Address } from './baseModels/Address/Address';
import { Defaults } from './baseModels/Defaults/Defaults';
import { Item } from './baseModels/Item/Item';
import { JournalEntry } from './baseModels/JournalEntry/JournalEntry';
import { JournalEntryAccount } from './baseModels/JournalEntryAccount/JournalEntryAccount';
import { Misc } from './baseModels/Misc';
import { Party } from './baseModels/Party/Party';
import { LoyaltyProgram } from './baseModels/LoyaltyProgram/LoyaltyProgram';
import { LoyaltyPointEntry } from './baseModels/LoyaltyPointEntry/LoyaltyPointEntry';
import { CollectionRulesItems } from './baseModels/CollectionRulesItems/CollectionRulesItems';
import { Lead } from './baseModels/Lead/Lead';
import { AppliedCouponCodes } from './baseModels/AppliedCouponCodes/AppliedCouponCodes';
import { CouponCode } from './baseModels/CouponCode/CouponCode';
import { Payment } from './baseModels/Payment/Payment';
import { PaymentFor } from './baseModels/PaymentFor/PaymentFor';
import { PriceList } from './baseModels/PriceList/PriceList';
import { PriceListItem } from './baseModels/PriceList/PriceListItem';
import { PricingRule } from './baseModels/PricingRule/PricingRule';
import { PricingRuleItem } from './baseModels/PricingRuleItem/PricingRuleItem';
import { PrintSettings } from './baseModels/PrintSettings/PrintSettings';
import { PrintTemplate } from './baseModels/PrintTemplate';
import { PurchaseInvoice } from './baseModels/PurchaseInvoice/PurchaseInvoice';
import { PurchaseInvoiceItem } from './baseModels/PurchaseInvoiceItem/PurchaseInvoiceItem';
import { SalesInvoice } from './baseModels/SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from './baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { SalesQuote } from './baseModels/SalesQuote/SalesQuote';
import { SalesQuoteItem } from './baseModels/SalesQuoteItem/SalesQuoteItem';
import { SetupWizard } from './baseModels/SetupWizard/SetupWizard';
import { Tax } from './baseModels/Tax/Tax';
import { TaxSummary } from './baseModels/TaxSummary/TaxSummary';
import { Batch } from './inventory/Batch';
import { InventorySettings } from './inventory/InventorySettings';
import { Location } from './inventory/Location';
import { PurchaseReceipt } from './inventory/PurchaseReceipt';
import { PurchaseReceiptItem } from './inventory/PurchaseReceiptItem';
import { SerialNumber } from './inventory/SerialNumber';
import { Shipment } from './inventory/Shipment';
import { ShipmentItem } from './inventory/ShipmentItem';
import { StockLedgerEntry } from './inventory/StockLedgerEntry';
import { StockMovement } from './inventory/StockMovement';
import { StockMovementItem } from './inventory/StockMovementItem';
import { ClosingAmounts } from './inventory/Point of Sale/ClosingAmounts';
import { ClosingCash } from './inventory/Point of Sale/ClosingCash';
import { OpeningAmounts } from './inventory/Point of Sale/OpeningAmounts';
import { OpeningCash } from './inventory/Point of Sale/OpeningCash';
import { POSSettings } from './inventory/Point of Sale/POSSettings';
import { POSShift } from './inventory/Point of Sale/POSShift';

export const models = {
  Account,
  AccountingLedgerEntry,
  AccountingSettings,
  Address,
  Batch,
  Defaults,
  Item,
  JournalEntry,
  JournalEntryAccount,
  Misc,
  Lead,
  Party,
  LoyaltyProgram,
  LoyaltyPointEntry,
  CollectionRulesItems,
  CouponCode,
  Payment,
  PaymentFor,
  PrintSettings,
  PriceList,
  PriceListItem,
  PricingRule,
  PricingRuleItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  SalesInvoice,
  SalesInvoiceItem,
  AppliedCouponCodes,
  SalesQuote,
  SalesQuoteItem,
  SerialNumber,
  SetupWizard,
  PrintTemplate,
  Tax,
  TaxSummary,
  // Inventory Models
  InventorySettings,
  StockMovement,
  StockMovementItem,
  StockLedgerEntry,
  Location,
  Shipment,
  ShipmentItem,
  PurchaseReceipt,
  PurchaseReceiptItem,
  // POS Models
  ClosingAmounts,
  ClosingCash,
  OpeningAmounts,
  OpeningCash,
  POSSettings,
  POSShift,
} as ModelMap;

export async function getRegionalModels(
  countryCode: string
): Promise<ModelMap> {
  if (countryCode !== 'in') {
    return {};
  }

  const { Address } = await import('./regionalModels/in/Address');
  const { Party } = await import('./regionalModels/in/Party');
  return { Address, Party };
}
