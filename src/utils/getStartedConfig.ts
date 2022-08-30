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
          description: t`Set up your company information, email, country and fiscal year`,
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
            'https://docs.frappebooks.com/setting-up/initial-entries.html#add-additional-bank-accounts',
        },
        {
          key: 'Opening Balances',
          label: t`Opening Balances`,
          icon: 'opening-ac',
          fieldname: 'openingBalanceChecked',
          description: t`Set up your opening balances before performing any accounting entries`,
          documentation:
            'https://docs.frappebooks.com/setting-up/opening-balances.html',
        },
        {
          key: 'Add Taxes',
          label: t`Add Taxes`,
          icon: 'percentage',
          fieldname: 'taxesAdded',
          description: t`Set up your tax templates for your sales or purchase transactions`,
          action: () => routeTo('/list/Tax'),
          documentation:
            'https://docs.frappebooks.com/setting-up/initial-entries.html#add-taxes',
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
          documentation:
            'https://docs.frappebooks.com/setting-up/initial-entries.html#add-sales-items',
        },
        {
          key: 'Add Customers',
          label: t`Add Customers`,
          icon: 'customer',
          description: t`Add a few customers to create your first sales invoice`,
          action: () => routeTo(`/list/Party/role/Customer/${t`Customers`}`),
          fieldname: 'customerCreated',
          documentation:
            'https://docs.frappebooks.com/setting-up/initial-entries.html#add-customers',
        },
        {
          key: 'Create Sales Invoice',
          label: t`Create Sales Invoice`,
          icon: 'sales-invoice',
          description: t`Create your first sales invoice for the created customer`,
          action: () => routeTo('/list/SalesInvoice'),
          fieldname: 'invoiceCreated',
          documentation:
            'https://docs.frappebooks.com/transactions/sales-invoices.html',
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
          description: t`Add a few suppliers to create your first purchase invoice`,
          action: () => routeTo(`/list/Party/role/Supplier/${t`Suppliers`}`),
          fieldname: 'supplierCreated',
        },
        {
          key: 'Create Purchase Invoice',
          label: t`Create Purchase Invoice`,
          icon: 'purchase-invoice',
          description: t`Create your first purchase invoice from the created supplier`,
          action: () => routeTo('/list/PurchaseInvoice'),
          fieldname: 'billCreated',
          documentation:
            'https://docs.frappebooks.com/transactions/purchase-invoices.html',
        },
      ],
    },
  ];
}
