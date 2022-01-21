import frappe from 'frappe';
import { _ } from 'frappe/utils';
import Icon from './components/Icon';

const config = {
  getTitle: async () => {
    const { companyName } = await frappe.getSingle('AccountingSettings');
    return companyName;
  },
  getGroups: () => [
    {
      title: _('Get Started'),
      route: '/get-started',
      icon: getIcon('general', '24', '5'),
    },
    {
      title: _('Dashboard'),
      route: '/',
      icon: getIcon('dashboard'),
    },
    {
      title: _('Sales'),
      icon: getIcon('sales'),
      route: '/list/SalesInvoice',
      items: [
        {
          label: _('Invoices'),
          route: '/list/SalesInvoice',
          doctype: 'SalesInvoice',
        },
        {
          label: _('Customers'),
          route: '/list/Customer',
          doctype: 'Customer',
        },
      ],
    },
    {
      title: _('Purchases'),
      icon: getIcon('purchase'),
      route: '/list/PurchaseInvoice',
      items: [
        {
          label: _('Bills'),
          route: '/list/PurchaseInvoice',
          doctype: 'PurchaseInvoice',
        },
        {
          label: _('Suppliers'),
          route: '/list/Supplier',
          doctype: 'Supplier',
        },
      ],
    },
    {
      title: _('Common Entries'),
      icon: getIcon('common-entries'),
      route: '/list/Item',
      items: [
        {
          label: _('Items'),
          route: '/list/Item',
          doctype: 'Item',
        },
        {
          label: _('Payments'),
          route: '/list/Payment',
          doctype: 'Payment',
        },
        {
          label: _('Journal Entry'),
          route: '/list/JournalEntry',
          doctype: 'JournalEntry',
        },
      ],
    },
    {
      title: _('Reports'),
      icon: getIcon('reports'),
      route: '/report/general-ledger',
      items: [
        {
          label: _('General Ledger'),
          route: '/report/general-ledger',
        },
        {
          label: _('Profit And Loss'),
          route: '/report/profit-and-loss',
        },
        {
          label: _('Balance Sheet'),
          route: '/report/balance-sheet',
        },
        {
          label: _('Trial Balance'),
          route: '/report/trial-balance',
        },
        {
          label: _('GSTR1'),
          route: '/report/gstr-1',
          hidden: () => frappe.AccountingSettings.country !== 'India',
        },
        {
          label: _('GSTR2'),
          route: '/report/gstr-2',
          hidden: () => frappe.AccountingSettings.country !== 'India',
        },
      ],
    },
    {
      title: _('Setup'),
      icon: getIcon('settings'),
      route: '/chart-of-accounts',
      items: [
        {
          label: _('Chart of Accounts'),
          route: '/chart-of-accounts',
        },
        {
          label: _('Taxes'),
          route: '/list/Tax',
          doctype: 'Tax',
        },
        {
          label: _('Settings'),
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
