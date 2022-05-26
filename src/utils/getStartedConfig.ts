import { t } from 'fyo';
import { openSettings, routeTo } from './ui';

export function getGetStartedConfig() {
  return [
    {
      label: t`Organisation`,

      items: [
        {
          key: 'Invoice',
          label: t`Invoice`,
          icon: 'invoice',
          description: t`Customize your invoices by adding a logo and address details`,
          fieldname: 'invoiceSetup',
          action() {
            openSettings('Invoice');
          },
        },
        {
          key: 'General',
          label: t`General`,
          icon: 'general',
          description: t`Setup your company information, email, country and fiscal year`,
          fieldname: 'companySetup',
          action() {
            openSettings('General');
          },
        },
        {
          key: 'System',
          label: t`System`,
          icon: 'system',
          description: t`Setup system defaults like date format and display precision`,
          fieldname: 'systemSetup',
          action() {
            openSettings('System');
          },
        },
      ],
    },
    {
      label: t`Accounts`,

      items: [
        {
          key: 'Review Accounts',
          label: t`Review Accounts`,
          icon: 'review-ac',
          description: t`Review your chart of accounts, add any account or tax heads as needed`,
          action: () => {
            routeTo('/chart-of-accounts');
          },
          fieldname: 'chartOfAccountsReviewed',
          documentation:
            'https://frappebooks.com/docs/setting-up#1-enter-bank-accounts',
        },
        {
          key: 'Opening Balances',
          label: t`Opening Balances`,
          icon: 'opening-ac',
          fieldname: 'openingBalanceChecked',
          description: t`Setup your opening balances before performing any accounting entries`,
          documentation:
            'https://frappebooks.com/docs/setting-up#5-setup-opening-balances',
        },
        {
          key: 'Add Taxes',
          label: t`Add Taxes`,
          icon: 'percentage',
          fieldname: 'taxesAdded',
          description: t`Setup your tax templates for your sales or purchase transactions`,
          action: () => routeTo('/list/Tax'),
          documentation: 'https://frappebooks.com/docs/setting-up#2-add-taxes',
        },
      ],
    },
    {
      label: t`Sales`,

      items: [
        {
          key: 'Add Sales Items',
          label: t`Add Items`,
          icon: 'item',
          description: t`Add products or services that you sell to your customers`,
          action: () => routeTo(`/list/Item/for/Sales/${t`Sales Items`}`),
          fieldname: 'salesItemCreated',
          documentation: 'https://frappebooks.com/docs/setting-up#3-add-items',
        },
        {
          key: 'Add Customers',
          label: t`Add Customers`,
          icon: 'customer',
          description: t`Add a few customers to create your first invoice`,
          action: () => routeTo(`/list/Party/role/Customer/${t`Customers`}`),
          fieldname: 'customerCreated',
          documentation:
            'https://frappebooks.com/docs/setting-up#4-add-customers',
        },
        {
          key: 'Create Invoice',
          label: t`Create Invoice`,
          icon: 'sales-invoice',
          description: t`Create your first invoice and mail it to your customer`,
          action: () => routeTo('/list/SalesInvoice'),
          fieldname: 'invoiceCreated',
          documentation: 'https://frappebooks.com/docs/invoices',
        },
      ],
    },
    {
      label: t`Purchase`,

      items: [
        {
          key: 'Add Purchase Items',
          label: t`Add Items`,
          icon: 'item',
          description: t`Add products or services that you buy from your suppliers`,
          action: () =>
            routeTo(`/list/Item/for/Purchases/${t`Purchase Items`}`),
          fieldname: 'purchaseItemCreated',
        },
        {
          key: 'Add Suppliers',
          label: t`Add Suppliers`,
          icon: 'supplier',
          description: t`Add a few suppliers to create your first bill`,
          action: () => routeTo(`/list/Party/role/Supplier/${t`Suppliers`}`),
          fieldname: 'supplierCreated',
        },
        {
          key: 'Create Bill',
          label: t`Create Bill`,
          icon: 'purchase-invoice',
          description: t`Create your first bill and mail it to your supplier`,
          action: () => routeTo('/list/PurchaseInvoice'),
          fieldname: 'billCreated',
          documentation: 'https://frappebooks.com/docs/bills',
        },
      ],
    },
  ];
}
