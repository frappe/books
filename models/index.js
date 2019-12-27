module.exports = {
  SetupWizard: require('./doctype/SetupWizard/SetupWizard'),
  Currency: require('./doctype/Currency/Currency'),
  Color: require('./doctype/Color/Color'),
  Account: require('./doctype/Account/Account.js'),
  AccountingSettings: require('./doctype/AccountingSettings/AccountingSettings'),
  CompanySettings: require('./doctype/CompanySettings/CompanySettings'),
  AccountingLedgerEntry: require('./doctype/AccountingLedgerEntry/AccountingLedgerEntry.js'),
  Party: require('./doctype/Party/Party.js'),
  Customer: require('./doctype/Party/Customer'),
  Supplier: require('./doctype/Party/Supplier'),

  Payment: require('./doctype/Payment/Payment.js'),
  PaymentFor: require('./doctype/PaymentFor/PaymentFor.js'),
  PaymentSettings: require('./doctype/PaymentSettings/PaymentSettings.js'),

  Item: require('./doctype/Item/Item.js'),

  SalesInvoice: require('./doctype/SalesInvoice/SalesInvoice.js'),
  SalesInvoiceItem: require('./doctype/SalesInvoiceItem/SalesInvoiceItem.js'),
  SalesInvoiceSettings: require('./doctype/SalesInvoiceSettings/SalesInvoiceSettings.js'),

  PurchaseInvoice: require('./doctype/PurchaseInvoice/PurchaseInvoice.js'),
  PurchaseInvoiceItem: require('./doctype/PurchaseInvoiceItem/PurchaseInvoiceItem.js'),
  PurchaseInvoiceSettings: require('./doctype/PurchaseInvoiceSettings/PurchaseInvoiceSettings.js'),

  Tax: require('./doctype/Tax/Tax.js'),
  TaxDetail: require('./doctype/TaxDetail/TaxDetail.js'),
  TaxSummary: require('./doctype/TaxSummary/TaxSummary.js'),

  GSTR3B: require('./doctype/GSTR3B/GSTR3B.js'),

  Address: require('./doctype/Address/Address.js'),
  Contact: require('./doctype/Contact/Contact.js'),

  JournalEntry: require('./doctype/JournalEntry/JournalEntry.js'),
  JournalEntryAccount: require('./doctype/JournalEntryAccount/JournalEntryAccount.js'),
  JournalEntrySettings: require('./doctype/JournalEntrySettings/JournalEntrySettings.js'),

  Quotation: require('./doctype/Quotation/Quotation.js'),
  QuotationItem: require('./doctype/QuotationItem/QuotationItem.js'),
  QuotationSettings: require('./doctype/QuotationSettings/QuotationSettings.js'),

  SalesOrder: require('./doctype/SalesOrder/SalesOrder.js'),
  SalesOrderItem: require('./doctype/SalesOrderItem/SalesOrderItem.js'),
  SalesOrderSettings: require('./doctype/SalesOrderSettings/SalesOrderSettings.js'),

  Fulfillment: require('./doctype/Fulfillment/Fulfillment.js'),
  FulfillmentItem: require('./doctype/FulfillmentItem/FulfillmentItem.js'),
  FulfillmentSettings: require('./doctype/FulfillmentSettings/FulfillmentSettings.js'),

  PurchaseOrder: require('./doctype/PurchaseOrder/PurchaseOrder.js'),
  PurchaseOrderItem: require('./doctype/PurchaseOrderItem/PurchaseOrderItem.js'),
  PurchaseOrderSettings: require('./doctype/PurchaseOrderSettings/PurchaseOrderSettings.js'),

  PurchaseReceipt: require('./doctype/PurchaseReceipt/PurchaseReceipt.js'),
  PurchaseReceiptItem: require('./doctype/PurchaseReceiptItem/PurchaseReceiptItem.js'),
  PurchaseReceiptSettings: require('./doctype/PurchaseReceiptSettings/PurchaseReceiptSettings.js'),

  Event: require('./doctype/Event/Event'),
  EventSchedule: require('./doctype/EventSchedule/EventSchedule'),
  EventSettings: require('./doctype/EventSettings/EventSettings'),

  Email: require('./doctype/Email/Email'),
  EmailAccount: require('./doctype/EmailAccount/EmailAccount'),

  PrintSettings: require('./doctype/PrintSettings/PrintSettings'),
  GetStarted: require('./doctype/GetStarted/GetStarted')
};
