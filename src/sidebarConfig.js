import frappe from 'frappejs';
import { openSettings } from '@/utils';
import { _ } from 'frappejs/utils';
import Icon from './components/Icon';
import router from './router';

const config = {
  getTitle: async () => {
    const { companyName } = await frappe.getSingle('AccountingSettings');
    return companyName;
  },
  groups: [
    {
      title: _('Get Started'),
      route: '/get-started',
      icon: getIcon('general', '24', '5')
    },
    {
      title: _('Dashboard'),
      route: '/',
      icon: getIcon('dashboard')
    },
    {
      title: _('Sales'),
      icon: getIcon('sales'),
      action() {
        router.push('/list/SalesInvoice');
      },
      items: [
        {
          label: _('Invoices'),
          route: '/list/SalesInvoice',
          doctype: 'SalesInvoice'
        },
        {
          label: _('Customers'),
          route: '/list/Customer',
          doctype: 'Customer'
        },
        {
          label: _('Items'),
          route: '/list/Item',
          doctype: 'Item'
        },
        {
          label: _('Payments'),
          route: '/list/Payment',
          doctype: 'Payment'
        },
        {
          label: _('Journal Entry'),
          route: '/list/JournalEntry',
          doctype: 'JournalEntry'
        }
      ]
    },
    {
      title: _('Purchases'),
      icon: getIcon('purchase'),
      action() {
        router.push('/list/PurchaseInvoice');
      },
      items: [
        {
          label: _('Bills'),
          route: '/list/PurchaseInvoice',
          doctype: 'PurchaseInvoice'
        },
        {
          label: _('Suppliers'),
          route: '/list/Supplier',
          doctype: 'Supplier'
        },
        {
          label: _('Items'),
          route: '/list/Item',
          doctype: 'Item'
        },
        {
          label: _('Payments'),
          route: '/list/Payment',
          doctype: 'Payment'
        },
        {
          label: _('Journal Entry'),
          route: '/list/JournalEntry',
          doctype: 'JournalEntry'
        }
      ]
    },
    {
      title: _('Reports'),
      icon: getIcon('reports'),
      action() {
        router.push('/report/general-ledger');
      },
      items: [
        {
          label: _('General Ledger'),
          route: '/report/general-ledger'
        },
        {
          label: _('Profit And Loss'),
          route: '/report/profit-and-loss'
        },
        {
          label: _('Balance Sheet'),
          route: '/report/balance-sheet'
        },
        {
          label: _('Trial Balance'),
          route: '/report/trial-balance'
        }
      ]
    },
    {
      title: _('Setup'),
      icon: getIcon('settings'),
      items: [
        {
          label: _('Chart of Accounts'),
          route: '/chart-of-accounts'
        },
        {
          label: _('Taxes'),
          route: '/list/Tax',
          doctype: 'Tax'
        },
        {
          label: _('Settings'),
          action() {
            openSettings();
          }
        }
      ]
    }
  ]
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
            height
          },
          this.$attrs
        )
      });
    }
  };
}

export default config;
