import frappe from 'frappejs';
import { openSettings } from './pages/Settings/utils';
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
          label: _('Invoice'),
          route: '/list/SalesInvoice'
        },
        {
          label: _('Customers'),
          route: '/list/Customer'
        },
        {
          label: _('Items'),
          route: '/list/Item'
        },
        {
          label: _('Taxes'),
          route: '/list/Tax'
        },
        {
          label: _('Journal Entry'),
          route: '/list/JournalEntry'
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
          label: _('Bill'),
          route: '/list/PurchaseInvoice'
        },
        {
          label: _('Suppliers'),
          route: '/list/Supplier'
        },
        {
          label: _('Items'),
          route: '/list/Item'
        },
        {
          label: _('Taxes'),
          route: '/list/Tax'
        },
        {
          label: _('Journal Entry'),
          route: '/list/JournalEntry'
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
      title: _('Settings'),
      icon: getIcon('settings'),
      action() {
        openSettings();
      }
    }
  ]
};

function getIcon(name) {
  return {
    name,
    render(h) {
      return h(Icon, {
        props: Object.assign({
          name,
          size: '18',
        }, this.$attrs)
      });
    }
  };
}

export default config;
