import { t } from 'fyo';
import { COATree } from 'models/baseModels/Account/types';

export function getStandardCOA(): COATree {
  return {
    [t`Application of Funds (Assets)`]: {
      [t`Current Assets`]: {
        [t`Accounts Receivable`]: {
          [t`Debtors`]: {
            accountType: 'Receivable',
          },
        },
        [t`Bank Accounts`]: {
          accountType: 'Bank',
          isGroup: true,
        },
        [t`Cash In Hand`]: {
          [t`Cash`]: {
            accountType: 'Cash',
          },
          accountType: 'Cash',
        },
        [t`Loans and Advances (Assets)`]: {
          isGroup: true,
        },
        [t`Securities and Deposits`]: {
          [t`Earnest Money`]: {},
        },
        [t`Stock Assets`]: {
          [t`Stock In Hand`]: {
            accountType: 'Stock',
          },
          accountType: 'Stock',
        },
        [t`Tax Assets`]: {
          isGroup: true,
        },
      },
      [t`Fixed Assets`]: {
        [t`Capital Equipments`]: {
          accountType: 'Fixed Asset',
        },
        [t`Electronic Equipments`]: {
          accountType: 'Fixed Asset',
        },
        [t`Furnitures and Fixtures`]: {
          accountType: 'Fixed Asset',
        },
        [t`Office Equipments`]: {
          accountType: 'Fixed Asset',
        },
        [t`Plants and Machineries`]: {
          accountType: 'Fixed Asset',
        },
        [t`Buildings`]: {
          accountType: 'Fixed Asset',
        },
        [t`Softwares`]: {
          accountType: 'Fixed Asset',
        },
        [t`Accumulated Depreciation`]: {
          accountType: 'Accumulated Depreciation',
        },
      },
      [t`Investments`]: {
        isGroup: true,
      },
      [t`Temporary Accounts`]: {
        [t`Temporary Opening`]: {
          accountType: 'Temporary',
        },
      },
      rootType: 'Asset',
    },
    [t`Expenses`]: {
      [t`Direct Expenses`]: {
        [t`Stock Expenses`]: {
          [t`Cost of Goods Sold`]: {
            accountType: 'Cost of Goods Sold',
          },
          [t`Expenses Included In Valuation`]: {
            accountType: 'Expenses Included In Valuation',
          },
          [t`Stock Adjustment`]: {
            accountType: 'Stock Adjustment',
          },
        },
      },
      [t`Indirect Expenses`]: {
        [t`Administrative Expenses`]: {},
        [t`Commission on Sales`]: {},
        [t`Depreciation`]: {
          accountType: 'Depreciation',
        },
        [t`Entertainment Expenses`]: {},
        [t`Freight and Forwarding Charges`]: {
          accountType: 'Chargeable',
        },
        [t`Legal Expenses`]: {},
        [t`Marketing Expenses`]: {
          accountType: 'Chargeable',
        },
        [t`Miscellaneous Expenses`]: {
          accountType: 'Chargeable',
        },
        [t`Office Maintenance Expenses`]: {},
        [t`Office Rent`]: {},
        [t`Postal Expenses`]: {},
        [t`Print and Stationery`]: {},
        [t`Round Off`]: {
          accountType: 'Round Off',
        },
        [t`Salary`]: {},
        [t`Sales Expenses`]: {},
        [t`Telephone Expenses`]: {},
        [t`Travel Expenses`]: {},
        [t`Utility Expenses`]: {},
        [t`Write Off`]: {},
        [t`Exchange Gain/Loss`]: {},
        [t`Gain/Loss on Asset Disposal`]: {},
      },
      rootType: 'Expense',
    },
    [t`Income`]: {
      [t`Direct Income`]: {
        [t`Sales`]: {},
        [t`Service`]: {},
      },
      [t`Indirect Income`]: {
        isGroup: true,
      },
      rootType: 'Income',
    },
    [t`Source of Funds (Liabilities)`]: {
      [t`Current Liabilities`]: {
        [t`Accounts Payable`]: {
          [t`Creditors`]: {
            accountType: 'Payable',
          },
          [t`Payroll Payable`]: {},
        },
        [t`Stock Liabilities`]: {
          [t`Stock Received But Not Billed`]: {
            accountType: 'Stock Received But Not Billed',
          },
        },
        [t`Duties and Taxes`]: {
          accountType: 'Tax',
          isGroup: true,
        },
        [t`Loans (Liabilities)`]: {
          [t`Secured Loans`]: {},
          [t`Unsecured Loans`]: {},
          [t`Bank Overdraft Account`]: {},
        },
      },
      rootType: 'Liability',
    },
    [t`Equity`]: {
      [t`Capital Stock`]: {
        accountType: 'Equity',
      },
      [t`Dividends Paid`]: {
        accountType: 'Equity',
      },
      [t`Opening Balance Equity`]: {
        accountType: 'Equity',
      },
      [t`Retained Earnings`]: {
        accountType: 'Equity',
      },
      rootType: 'Equity',
    },
  };
}
