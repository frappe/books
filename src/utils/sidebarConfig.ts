import { t } from 'fyo';
import { routeFilters } from 'src/utils/filters';
import { fyo } from '../initFyo';
import { SidebarConfig, SidebarItem, SidebarRoot } from './types';

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

function getInventorySidebar(): SidebarRoot[] {
  const hasInventory = !!fyo.singles.AccountingSettings?.enableInventory;
  if (!hasInventory) {
    return [];
  }

  return [
    {
      label: t`Inventory`,
      name: 'inventory',
      icon: 'inventory',
      iconSize: '18',
      route: '/list/StockMovement',
      items: [
        {
          label: t`Stock Movement`,
          name: 'stock-movement',
          route: '/list/StockMovement',
          schemaName: 'StockMovement',
        },
        {
          label: t`Shipment`,
          name: 'shipment',
          route: '/list/Shipment',
          schemaName: 'Shipment',
        },
        {
          label: t`Purchase Receipt`,
          name: 'purchase-receipt',
          route: '/list/PurchaseReceipt',
          schemaName: 'PurchaseReceipt',
        },
        {
          label: t`Stock Ledger`,
          name: 'stock-ledger',
          route: '/report/StockLedger',
        },
        {
          label: t`Stock Balance`,
          name: 'stock-balance',
          route: '/report/StockBalance',
        },
      ],
    },
  ];
}

function getPOSSidebar() {
  const isPOSEnabled = !!fyo.singles.InventorySettings?.enablePointOfSale;
  if (!isPOSEnabled) {
    return [];
  }

  return {
    label: t`POS`,
    name: 'pos',
    route: '/pos',
    icon: 'pos',
  };
}

function getReportSidebar() {
  return {
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
  };
}

function getCompleteSidebar(): SidebarConfig {
  return [
    {
      label: t`Get Started`,
      name: 'get-started',
      route: '/get-started',
      icon: 'general',
      iconSize: '24',
      iconHeight: 5,
      hidden: () => !!fyo.singles.SystemSettings?.hideGetStarted,
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
          label: t`Sales Quotes`,
          name: 'sales-quotes',
          route: '/list/SalesQuote',
          schemaName: 'SalesQuote',
        },
        {
          label: t`Sales Invoices`,
          name: 'sales-invoices',
          route: '/list/SalesInvoice',
          schemaName: 'SalesInvoice',
        },
        {
          label: t`Sales Payments`,
          name: 'payments',
          route: `/list/Payment/${t`Sales Payments`}`,
          schemaName: 'Payment',
          filters: routeFilters.SalesPayments,
        },
        {
          label: t`Customers`,
          name: 'customers',
          route: `/list/Party/${t`Customers`}`,
          schemaName: 'Party',
          filters: routeFilters.Customers,
        },
        {
          label: t`Sales Items`,
          name: 'sales-items',
          route: `/list/Item/${t`Sales Items`}`,
          schemaName: 'Item',
          filters: routeFilters.SalesItems,
        },
        {
          label: t`Loyalty Program`,
          name: 'loyalty-program',
          route: '/list/LoyaltyProgram',
          schemaName: 'LoyaltyProgram',
          hidden: () => !fyo.singles.AccountingSettings?.enableLoyaltyProgram,
        },
        {
          label: t`Lead`,
          name: 'lead',
          route: '/list/Lead',
          schemaName: 'Lead',
          hidden: () => !fyo.singles.AccountingSettings?.enableLead,
        },
        {
          label: t`Pricing Rule`,
          name: 'pricing-rule',
          route: '/list/PricingRule',
          schemaName: 'PricingRule',
          hidden: () => !fyo.singles.AccountingSettings?.enablePricingRule,
        },
        {
          label: t`Coupon Code`,
          name: 'coupon-code',
          route: `/list/CouponCode`,
          schemaName: 'CouponCode',
          hidden: () => !fyo.singles.AccountingSettings?.enableCouponCode,
        },
      ] as SidebarItem[],
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
          route: `/list/Payment/${t`Purchase Payments`}`,
          schemaName: 'Payment',
          filters: routeFilters.PurchasePayments,
        },
        {
          label: t`Suppliers`,
          name: 'suppliers',
          route: `/list/Party/${t`Suppliers`}`,
          schemaName: 'Party',
          filters: routeFilters.Suppliers,
        },
        {
          label: t`Purchase Items`,
          name: 'purchase-items',
          route: `/list/Item/${t`Purchase Items`}`,
          schemaName: 'Item',
          filters: routeFilters.PurchaseItems,
        },
      ] as SidebarItem[],
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
          route: '/list/Party',
          schemaName: 'Party',
          filters: { role: 'Both' },
        },
        {
          label: t`Items`,
          name: 'common-items',
          route: `/list/Item/${t`Items`}`,
          schemaName: 'Item',
          filters: { for: 'Both' },
        },
        {
          label: t`Price List`,
          name: 'price-list',
          route: '/list/PriceList',
          schemaName: 'PriceList',
          hidden: () => !fyo.singles.AccountingSettings?.enablePriceList,
        },
      ] as SidebarItem[],
    },
    getReportSidebar(),
    getInventorySidebar(),
    getPOSSidebar(),
    getRegionalSidebar(),
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
          label: t`Tax Templates`,
          name: 'taxes',
          route: '/list/Tax',
          schemaName: 'Tax',
        },
        {
          label: t`Import Wizard`,
          name: 'import-wizard',
          route: '/import-wizard',
        },
        {
          label: t`Print Templates`,
          name: 'print-template',
          route: `/list/PrintTemplate/${t`Print Templates`}`,
        },
        {
          label: t`Customize Form`,
          name: 'customize-form',
          // route: `/customize-form`,
          route: `/list/CustomForm/${t`Customize Form`}`,
          hidden: () =>
            !fyo.singles.AccountingSettings?.enableFormCustomization,
        },
        {
          label: t`Settings`,
          name: 'settings',
          route: '/settings',
        },
      ] as SidebarItem[],
    },
  ].flat();
}
