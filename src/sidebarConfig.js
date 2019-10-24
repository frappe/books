import frappe from 'frappejs';
import { remote } from 'electron';
import { _ } from 'frappejs/utils';
import DashboardIcon from './components/Icons/Dashboard';
import SalesIcon from './components/Icons/Sales';
import PurchasesIcon from './components/Icons/Purchases';
import ReportsIcon from './components/Icons/Reports';
import SettingsIcon from './components/Icons/Settings';
import theme from '@/theme';

const config = {
  getTitle: async () => {
    const { companyName, country } = await frappe.getSingle(
      'AccountingSettings'
    );
    // if (country === 'India') {
    //   config.groups[2].items.push(
    //     {
    //       label: _('GSTR 1'),
    //       route: '/report/gstr-1?transferType=B2B'
    //     },
    //     {
    //       label: _('GSTR 2'),
    //       route: '/report/gstr-2?transferType=B2B'
    //     },
    //     {
    //       label: _('GSTR 3B'),
    //       route: '/list/GSTR3B'
    //     }
    //   );
    // }
    return companyName;
  },
  groups: [
    {
      title: _('Dashboard'),
      route: '/',
      icon: DashboardIcon
    },
    {
      title: _('Sales'),
      icon: SalesIcon,
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
        }
      ]
    },
    {
      title: _('Purchases'),
      icon: PurchasesIcon,
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
        }
      ]
    },
    {
      title: _('Reports'),
      icon: ReportsIcon,
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
      icon: SettingsIcon,
      action() {
        let child = new remote.BrowserWindow({
          parent: remote.getCurrentWindow(),
          frame: false,
          width: 460,
          height: 577,
          backgroundColor: theme.backgroundColor.gray['200'],
          webPreferences: {
            webSecurity: false,
            nodeIntegration: true
          }
        });
        child.loadURL('http://localhost:8000/#/settings');
      }
    }
  ]
};

export default config;
