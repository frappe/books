import { t } from 'fyo';
import { fyo } from '../initFyo';
import { SidebarConfig, SidebarRoot } from './types';

export function getSidebarConfig(): SidebarConfig {
  const sideBar = getCompleteSidebar();
  return getFilteredSidebar(sideBar);
}

function getFilteredSidebar(sideBar: SidebarConfig): SidebarConfig {
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

function getRegionalSidebar(): SidebarRoot[] {
  const hasGstin = !!fyo.singles?.AccountingSettings?.gstin;
  if (!hasGstin) {
    return [];
  }

  return [
    {
      label: t`GST`,
      name: 'gst',
      icon: 'gst',
      route: '/report/GSTR1',
      items: [
        {
          label: t`GSTR1`,
          name: 'gstr1',
          route: '/report/GSTR1',
        },
        {
          label: t`GSTR2`,
          name: 'gstr2',
          route: '/report/GSTR2',
        },
      ],
    },
  ];
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
          schemaName: 'SalesInvoice',
        },
        {
          label: t`Sales Payments`,
          name: 'payments',
          route: `/list/Payment/paymentType/Receive/${t`Sales Payments`}`,
          schemaName: 'Payment',
        },
        {
          label: t`Customers`,
          name: 'customers',
          route: `/list/Party/role/Customer/${t`Customers`}`,
          schemaName: 'Party',
        },
        {
          label: t`Sales Items`,
          name: 'sales-items',
          route: `/list/Item/for/Sales/${t`Sales Items`}`,
          schemaName: 'Item',
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
          schemaName: 'PurchaseInvoice',
        },
        {
          label: t`Purchase Payments`,
          name: 'payments',
          route: `/list/Payment/paymentType/Pay/${t`Purchase Payments`}`,
          schemaName: 'Payment',
        },
        {
          label: t`Suppliers`,
          name: 'suppliers',
          route: `/list/Party/role/Supplier/${t`Suppliers`}`,
          schemaName: 'Party',
        },
        {
          label: t`Purchase Items`,
          name: 'purchase-items',
          route: `/list/Item/for/Purchases/${t`Purchase Items`}`,
          schemaName: 'Item',
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
          schemaName: 'JournalEntry',
        },
        {
          label: t`Party`,
          name: 'party',
          route: '/list/Party/role/Both',
          schemaName: 'Party',
        },
        {
          label: t`Common Items`,
          name: 'common-items',
          route: `/list/Item/for/Both/${t`Common Items`}`,
          schemaName: 'Item',
        },
      ],
    },
    {
      label: t`Reports`,
      name: 'reports',
      icon: 'reports',
      route: '/report/GeneralLedger',
      items: [
        {
          label: t`General Ledger`,
          name: 'general-ledger',
          route: '/report/GeneralLedger',
        },
        {
          label: t`Profit And Loss`,
          name: 'profit-and-loss',
          route: '/report/ProfitAndLoss',
        },
        {
          label: t`Balance Sheet`,
          name: 'balance-sheet',
          route: '/report/BalanceSheet',
        },
        {
          label: t`Trial Balance`,
          name: 'trial-balance',
          route: '/report/TrialBalance',
        },
      ],
    },
    ...getRegionalSidebar(),
    {
      label: t`Setup`,
      name: 'setup',
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
          schemaName: 'Tax',
        },
        {
          label: t`Data Import`,
          name: 'data-import',
          route: '/data-import',
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
