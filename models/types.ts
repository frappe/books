export type InvoiceStatus =
  | 'Draft'
  | 'Saved'
  | 'Unpaid'
  | 'Cancelled'
  | 'Paid'
  | 'Return'
  | 'ReturnIssued'
  | 'Unpaid'
  | 'PartlyPaid';

export enum ModelNameEnum {
  Account = 'Account',
  AccountingLedgerEntry = 'AccountingLedgerEntry',
  AccountingSettings = 'AccountingSettings',
  Address = 'Address',
  Batch = 'Batch',
  Color = 'Color',
  Currency = 'Currency',
  GetStarted = 'GetStarted',
  Defaults = 'Defaults',
  Item = 'Item',
  ItemGroup = 'ItemGroup',
  ItemEnquiry = 'ItemEnquiry',
  UOM = 'UOM',
  UOMConversionItem = 'UOMConversionItem',
  JournalEntry = 'JournalEntry',
  JournalEntryAccount = 'JournalEntryAccount',
  Misc = 'Misc',
  NumberSeries = 'NumberSeries',
  Lead = 'Lead',
  Party = 'Party',
  LoyaltyProgram = 'LoyaltyProgram',
  LoyaltyPointEntry = 'LoyaltyPointEntry',
  CollectionRulesItems = 'CollectionRulesItems',
  CouponCode = 'CouponCode',
  IntegrationErrorLog = 'IntegrationErrorLog',
  AppliedCouponCodes = 'AppliedCouponCodes',
  Payment = 'Payment',
  PaymentMethod = 'PaymentMethod',
  PaymentFor = 'PaymentFor',
  PriceList = 'PriceList',
  PriceListItem = 'PriceListItem',
  PricingRule = 'PricingRule',
  PricingRuleItem = 'PricingRuleItem',
  PricingRuleDetail = 'PricingRuleDetail',
  PrintSettings = 'PrintSettings',
  PrintTemplate = 'PrintTemplate',
  PurchaseInvoice = 'PurchaseInvoice',
  PurchaseInvoiceItem = 'PurchaseInvoiceItem',
  SalesInvoice = 'SalesInvoice',
  SalesInvoiceItem = 'SalesInvoiceItem',
  SalesQuote = 'SalesQuote',
  SalesQuoteItem = 'SalesQuoteItem',
  SerialNumber = 'SerialNumber',
  SetupWizard = 'SetupWizard',
  Tax = 'Tax',
  TaxDetail = 'TaxDetail',
  TaxSummary = 'TaxSummary',
  PatchRun = 'PatchRun',
  SingleValue = 'SingleValue',
  InventorySettings = 'InventorySettings',
  SystemSettings = 'SystemSettings',
  StockMovement = 'StockMovement',
  StockMovementItem = 'StockMovementItem',
  StockLedgerEntry = 'StockLedgerEntry',
  Shipment = 'Shipment',
  ShipmentItem = 'ShipmentItem',
  PurchaseReceipt = 'PurchaseReceipt',
  PurchaseReceiptItem = 'PurchaseReceiptItem',
  Location = 'Location',
  CustomForm = 'CustomForm',
  CustomField = 'CustomField',
  POSSettings = 'POSSettings',
  POSProfile = 'POSProfile',
  POSOpeningShift = 'POSOpeningShift',
  POSClosingShift = 'POSClosingShift',

  ERPNextSyncSettings = 'ERPNextSyncSettings',
  ERPNextSyncQueue = 'ERPNextSyncQueue',
  FetchFromERPNextQueue = 'FetchFromERPNextQueue',
}

export type ModelName = keyof typeof ModelNameEnum;

export type PaymentMethodType = 'Cash' | 'Bank';
