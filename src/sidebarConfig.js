import frappe from 'frappejs';
import { _ } from 'frappejs/utils';
import Icon from './components/Icon';

const config = {
  getTitle: async () => {
    const { companyName } = await frappe.getSingle('AccountingSettings');
    return companyName;
  },
  groups: [
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
          visible: 1,
        },
        {
          label: _('Customers'),
          route: '/list/Customer',
          doctype: 'Customer',
          visible: 1,
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
          visible: 1,
        },
        {
          label: _('Suppliers'),
          route: '/list/Supplier',
          doctype: 'Supplier',
          visible: 1,
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
          visible: 1,
        },
        {
          label: _('Payments'),
          route: '/list/Payment',
          doctype: 'Payment',
          visible: 1,
        },
        {
          label: _('Journal Entry'),
          route: '/list/JournalEntry',
          doctype: 'JournalEntry',
          visible: 1,
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
          visible: 1,
        },
        {
          label: _('Profit And Loss'),
          route: '/report/profit-and-loss',
          visible: 1,
        },
        {
          label: _('Balance Sheet'),
          route: '/report/balance-sheet',
          visible: 1,
        },
        {
          label: _('Trial Balance'),
          route: '/report/trial-balance',
          visible: 1,
        },
        {
          label: _('GSTR1'),
          route: '/report/gstr-1',
          visible: async () => {
            const { country } = await frappe.getSingle('AccountingSettings');
            if (country === 'India') return 1;
            return 0;
          },
        },
        {
          label: _('GSTR2'),
          route: '/report/gstr-2',
          visible: async () => {
            const { country } = await frappe.getSingle('AccountingSettings');
            if (country === 'India') return 1;
            return 0;
          },
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
          visible: 1,
        },
        {
          label: _('Taxes'),
          route: '/list/Tax',
          doctype: 'Tax',
          visible: 1,
        },
        {
          label: _('Settings'),
          route: '/settings',
          visible: 1,
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
