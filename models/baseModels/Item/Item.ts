import frappe from 'frappe';
import { DocValue } from 'frappe/core/types';
import Doc from 'frappe/model/doc';
import {
  Action,
  DependsOnMap,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
  ValidationMap,
} from 'frappe/model/types';
import Money from 'pesa/dist/types/src/money';

export class Item extends Doc {
  formulas: FormulaMap = {
    incomeAccount: async () => {
      let accountName = 'Service';
      if (this.itemType === 'Product') {
        accountName = 'Sales';
      }

      const accountExists = await frappe.db.exists('Account', accountName);
      return accountExists ? accountName : '';
    },
    expenseAccount: async () => {
      const cogs = await frappe.db.getAllRaw('Account', {
        filters: {
          accountType: 'Cost of Goods Sold',
        },
      });

      if (cogs.length === 0) {
        return '';
      } else {
        return cogs[0].name as string;
      }
    },
  };

  static filters: FiltersMap = {
    incomeAccount: () => ({
      isGroup: false,
      rootType: 'Income',
    }),
    expenseAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
  };

  dependsOn: DependsOnMap = {
    incomeAccount: ['itemType'],
    expenseAccount: ['itemType'],
  };

  validations: ValidationMap = {
    rate: async (value: DocValue) => {
      if ((value as Money).isNegative()) {
        throw new frappe.errors.ValidationError(
          frappe.t`Rate can't be negative.`
        );
      }
    },
  };

  static actions: Action[] = [
    {
      label: frappe.t`New Invoice`,
      condition: (doc) => !doc.isNew,
      action: async (doc, router) => {
        const invoice = await frappe.doc.getEmptyDoc('SalesInvoice');
        invoice.append('items', {
          item: doc.name as string,
          rate: doc.rate as Money,
          tax: doc.tax as string,
        });
        router.push(`/edit/SalesInvoice/${invoice.name}`);
      },
    },
    {
      label: frappe.t`New Bill`,
      condition: (doc) => !doc.isNew,
      action: async (doc, router) => {
        const invoice = await frappe.doc.getEmptyDoc('PurchaseInvoice');
        invoice.append('items', {
          item: doc.name as string,
          rate: doc.rate as Money,
          tax: doc.tax as string,
        });
        router.push(`/edit/PurchaseInvoice/${invoice.name}`);
      },
    },
  ];

  listSettings: ListViewSettings = {
    columns: ['name', 'unit', 'tax', 'rate'],
  };
}
