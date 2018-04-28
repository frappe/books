module.exports = {
    models: {
        Account: require('./doctype/Account/Account.js'),
        AccountingSettings: require('./doctype/AccountingSettings/AccountingSettings'),
        AccountingLedgerEntry: require('./doctype/AccountingLedgerEntry/AccountingLedgerEntry.js'),
        Party: require('./doctype/Party/Party.js'),

        Payment: require('./doctype/Payment/Payment.js'),
        PaymentFor: require('./doctype/PaymentFor/PaymentFor.js'),
        PaymentSettings: require('./doctype/PaymentSettings/PaymentSettings.js'),

        Item: require('./doctype/Item/Item.js'),

        Invoice: require('./doctype/Invoice/Invoice.js'),
        InvoiceItem: require('./doctype/InvoiceItem/InvoiceItem.js'),
        InvoiceSettings: require('./doctype/InvoiceSettings/InvoiceSettings.js'),

        Bill: require('./doctype/Bill/Bill.js'),
        BillItem: require('./doctype/BillItem/BillItem.js'),
        BillSettings: require('./doctype/BillSettings/BillSettings.js'),

        Tax: require('./doctype/Tax/Tax.js'),
        TaxDetail: require('./doctype/TaxDetail/TaxDetail.js'),
        TaxSummary: require('./doctype/TaxSummary/TaxSummary.js'),

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
    }
}
