import { t } from 'fyo';
import { fyo } from './initFyo';

const config = {
  getTitle: async () => {
    const { companyName } = await fyo.doc.getSingle('AccountingSettings');
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
          label: t`Payments`,
          route: '/list/Payment/paymentType/Receive',
          doctype: 'Payment',
        },
        {
          label: t`Customers`,
          route: '/list/Customer',
          doctype: 'Customer',
        },
        {
          label: t`Sales Items`,
          route: '/list/Item/for/sales',
          doctype: 'Item',
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
          label: t`Payments`,
          route: '/list/Payment/paymentType/Pay',
          doctype: 'Payment',
        },
        {
          label: t`Suppliers`,
          route: '/list/Supplier',
          doctype: 'Supplier',
        },
        {
          label: t`Purchase Items`,
          route: '/list/Item/for/purchases',
          doctype: 'Item',
        },
      ],
    },
    {
      icon: 'common-entries',
      title: t`Common`,
      route: '/list/JournalEntry',
      items: [
        {
          label: t`Journal Entry`,
          route: '/list/JournalEntry',
          doctype: 'JournalEntry',
        },
        {
          label: t`Common Items`,
          route: '/list/Item/for/both',
          doctype: 'Item',
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
          hidden: () => fyo.singles.AccountingSettings!.country !== 'India',
        },
        {
          label: t`GSTR2`,
          route: '/report/gstr-2',
          hidden: () => fyo.singles.AccountingSettings!.country !== 'India',
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
