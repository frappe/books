import frappe, { t } from 'frappe';

const config = {
  getTitle: async () => {
    const { companyName } = await frappe.getSingle('AccountingSettings');
    return companyName;
  },
  getGroups: () => [
    {
      title: t`Get Started`,
      route: '/get-started',
      icon: 'general',
      iconSize: '24',
      iconHeight: '5',
    },
    {
      title: t`Dashboard`,
      route: '/',
      icon: 'dashboard',
    },
    {
      title: t`Sales`,
      icon: 'sales',
      route: '/list/SalesInvoice',
      items: [
        {
          label: t`Invoices`,
          route: '/list/SalesInvoice',
          doctype: 'SalesInvoice',
        },
        {
          label: t`Customers`,
          route: '/list/Customer',
          doctype: 'Customer',
        },
      ],
    },
    {
      title: t`Purchases`,
      icon: 'purchase',
      route: '/list/PurchaseInvoice',
      items: [
        {
          label: t`Bills`,
          route: '/list/PurchaseInvoice',
          doctype: 'PurchaseInvoice',
        },
        {
          label: t`Suppliers`,
          route: '/list/Supplier',
          doctype: 'Supplier',
        },
      ],
    },
    {
      icon: 'common-entries',
      title: t`Common`,
      route: '/list/Item',
      items: [
        {
          label: t`Items`,
          route: '/list/Item',
          doctype: 'Item',
        },
        {
          label: t`Payments`,
          route: '/list/Payment',
          doctype: 'Payment',
        },
        {
          label: t`Journal Entry`,
          route: '/list/JournalEntry',
          doctype: 'JournalEntry',
        },
      ],
    },
    {
      title: t`Reports`,
      icon: 'reports',
      route: '/report/general-ledger',
      items: [
        {
          label: t`General Ledger`,
          route: '/report/general-ledger',
        },
        {
          label: t`Profit And Loss`,
          route: '/report/profit-and-loss',
        },
        {
          label: t`Balance Sheet`,
          route: '/report/balance-sheet',
        },
        {
          label: t`Trial Balance`,
          route: '/report/trial-balance',
        },
        {
          label: t`GSTR1`,
          route: '/report/gstr-1',
          hidden: () => frappe.AccountingSettings.country !== 'India',
        },
        {
          label: t`GSTR2`,
          route: '/report/gstr-2',
          hidden: () => frappe.AccountingSettings.country !== 'India',
        },
      ],
    },
    {
      title: t`Setup`,
      icon: 'settings',
      route: '/chart-of-accounts',
      items: [
        {
          label: t`Chart of Accounts`,
          route: '/chart-of-accounts',
        },
        {
          label: t`Taxes`,
          route: '/list/Tax',
          doctype: 'Tax',
        },
        {
          label: t`Data Import`,
          route: '/data_import',
        },
        {
          label: t`Settings`,
          route: '/settings',
        },
      ],
    },
  ],
};

export default config;
