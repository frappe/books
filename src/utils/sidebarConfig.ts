import { t } from 'fyo';
import { fyo } from '../initFyo';
import { SidebarConfig } from './types';

export function getSidebarConfig(): SidebarConfig {
  const sideBar = getCompleteSidebar();
  return getFilteredSidebar(sideBar);
}

export function getFilteredSidebar(sideBar: SidebarConfig): SidebarConfig {
  return sideBar.filter((root) => {
    root.items = root.items?.filter((item) => {
      if (item.hidden !== undefined) {
        return !item.hidden();
      }

      return true;
    });

    if (root.hidden !== undefined) {
      return !root.hidden();
    }

    return true;
  });
}

function getCompleteSidebar(): SidebarConfig {
  return [
    {
      label: t`Get Started`,
      name: 'get-started',
      route: '/get-started',
      icon: 'general',
      iconSize: '24',
      iconHeight: '5',
      hidden: () => fyo.singles.SystemSettings!.hideGetStarted as boolean,
    },
    {
      label: t`Dashboard`,
      name: 'dashboard',
      route: '/',
      icon: 'dashboard',
    },
    {
      label: t`Sales`,
      name: 'sales',
      icon: 'sales',
      route: '/list/SalesInvoice',
      items: [
        {
          label: t`Sales Invoices`,
          name: 'sales-invoices',
          route: '/list/SalesInvoice',
          doctype: 'SalesInvoice',
        },
        {
          label: t`Payments`,
          name: 'payments',
          route: '/list/Payment/paymentType/Receive',
          doctype: 'Payment',
        },
        {
          label: t`Customers`,
          name: 'customers',
          route: '/list/Customer',
          doctype: 'Customer',
        },
        {
          label: t`Sales Items`,
          name: 'sales-items',
          route: '/list/Item/for/sales',
          doctype: 'Item',
        },
      ],
    },
    {
      label: t`Purchases`,
      name: 'purchases',
      icon: 'purchase',
      route: '/list/PurchaseInvoice',
      items: [
        {
          label: t`Purchase Invoices`,
          name: 'purchase-invoices',
          route: '/list/PurchaseInvoice',
          doctype: 'PurchaseInvoice',
        },
        {
          label: t`Payments`,
          name: 'payments',
          route: '/list/Payment/paymentType/Pay',
          doctype: 'Payment',
        },
        {
          label: t`Suppliers`,
          name: 'suppliers',
          route: '/list/Supplier',
          doctype: 'Supplier',
        },
        {
          label: t`Purchase Items`,
          name: 'purchase-items',
          route: '/list/Item/for/purchases',
          doctype: 'Item',
        },
      ],
    },
    {
      label: t`Common`,
      name: 'common-entries',
      icon: 'common-entries',
      route: '/list/JournalEntry',
      items: [
        {
          label: t`Journal Entry`,
          name: 'journal-entry',
          route: '/list/JournalEntry',
          doctype: 'JournalEntry',
        },
        {
          label: t`Common Items`,
          name: 'common-items',
          route: '/list/Item/for/both',
          doctype: 'Item',
        },
      ],
    },
    {
      label: t`Reports`,
      name: t`reports`,
      icon: 'reports',
      route: '/report/general-ledger',
      items: [
        {
          label: t`General Ledger`,
          name: 'general-ledger',
          route: '/report/general-ledger',
        },
        {
          label: t`Profit And Loss`,
          name: 'profit-and-loss',
          route: '/report/profit-and-loss',
        },
        {
          label: t`Balance Sheet`,
          name: 'balance-sheet',
          route: '/report/balance-sheet',
        },
        {
          label: t`Trial Balance`,
          name: 'trial-balance',
          route: '/report/trial-balance',
        },
        {
          label: t`GSTR1`,
          name: 'gstr1',
          route: '/report/gstr-1',
          hidden: () => fyo.singles.AccountingSettings!.country !== 'India',
        },
        {
          label: t`GSTR2`,
          name: 'gstr2',
          route: '/report/gstr-2',
          hidden: () => fyo.singles.AccountingSettings!.country !== 'India',
        },
      ],
    },
    {
      label: t`Setup`,
      name: t`setup`,
      icon: 'settings',
      route: '/chart-of-accounts',
      items: [
        {
          label: t`Chart of Accounts`,
          name: 'chart-of-accounts',
          route: '/chart-of-accounts',
        },
        {
          label: t`Taxes`,
          name: 'taxes',
          route: '/list/Tax',
          doctype: 'Tax',
        },
        {
          label: t`Data Import`,
          name: 'data-import',
          route: '/data_import',
        },
        {
          label: t`Settings`,
          name: 'settings',
          route: '/settings',
        },
      ],
    },
  ];
}
