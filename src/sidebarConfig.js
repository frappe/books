import frappe, { t } from 'frappe';
import Icon from './components/Icon';

const config = {
  getTitle: async () => {
    const { companyName } = await frappe.getSingle('AccountingSettings');
    return companyName;
  },
  getGroups: () => [
    {
      title: t('Get Started'),
      route: '/get-started',
      icon: getIcon('general', '24', '5'),
    },
    {
      title: t('Dashboard'),
      route: '/',
      icon: getIcon('dashboard'),
    },
    {
      title: t('Sales'),
      icon: getIcon('sales'),
      route: '/list/SalesInvoice',
      items: [
        {
          label: t('Invoices'),
          route: '/list/SalesInvoice',
          doctype: 'SalesInvoice',
        },
        {
          label: t('Customers'),
          route: '/list/Customer',
          doctype: 'Customer',
        },
      ],
    },
    {
      title: t('Purchases'),
      icon: getIcon('purchase'),
      route: '/list/PurchaseInvoice',
      items: [
        {
          label: t('Bills'),
          route: '/list/PurchaseInvoice',
          doctype: 'PurchaseInvoice',
        },
        {
          label: t('Suppliers'),
          route: '/list/Supplier',
          doctype: 'Supplier',
        },
      ],
    },
    {
      title: t('Common'),
      icon: getIcon('common-entries'),
      route: '/list/Item',
      items: [
        {
          label: t('Items'),
          route: '/list/Item',
          doctype: 'Item',
        },
        {
          label: t('Payments'),
          route: '/list/Payment',
          doctype: 'Payment',
        },
        {
          label: t('Journal Entry'),
          route: '/list/JournalEntry',
          doctype: 'JournalEntry',
        },
      ],
    },
    {
      title: t('Reports'),
      icon: getIcon('reports'),
      route: '/report/general-ledger',
      items: [
        {
          label: t('General Ledger'),
          route: '/report/general-ledger',
        },
        {
          label: t('Profit And Loss'),
          route: '/report/profit-and-loss',
        },
        {
          label: t('Balance Sheet'),
          route: '/report/balance-sheet',
        },
        {
          label: t('Trial Balance'),
          route: '/report/trial-balance',
        },
        {
          label: t('GSTR1'),
          route: '/report/gstr-1',
          hidden: () => frappe.AccountingSettings.country !== 'India',
        },
        {
          label: t('GSTR2'),
          route: '/report/gstr-2',
          hidden: () => frappe.AccountingSettings.country !== 'India',
        },
      ],
    },
    {
      title: t('Setup'),
      icon: getIcon('settings'),
      route: '/chart-of-accounts',
      items: [
        {
          label: t('Chart of Accounts'),
          route: '/chart-of-accounts',
        },
        {
          label: t('Taxes'),
          route: '/list/Tax',
          doctype: 'Tax',
        },
        {
          label: t('Settings'),
          route: '/settings',
        },
      ],
    },
  ],
};

function getIcon(name, size = '18', height = null) {
  return {
    name,
    render(h) {
      return h(Icon, {
        props: Object.assign(
          {
            name,
            size,
            height,
          },
          this.$attrs
        ),
      });
    },
  };
}

export default config;
