import { Fyo } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  DependsOnMap,
  FiltersMap,
  FormulaMap,
  ListViewSettings,
  ValidationMap,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import Money from 'pesa/dist/types/src/money';

export class Item extends Doc {
  formulas: FormulaMap = {
    incomeAccount: async () => {
      let accountName = 'Service';
      if (this.itemType === 'Product') {
        accountName = 'Sales';
      }

      const accountExists = await this.fyo.db.exists('Account', accountName);
      return accountExists ? accountName : '';
    },
    expenseAccount: async () => {
      const cogs = await this.fyo.db.getAllRaw('Account', {
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
        throw new ValidationError(this.fyo.t`Rate can't be negative.`);
      }
    },
  };

  static getActions(fyo: Fyo): Action[] {
    return [
      {
        label: fyo.t`New Invoice`,
        condition: (doc) => !doc.notInserted,
        action: async (doc, router) => {
          const invoice = await fyo.doc.getNewDoc('SalesInvoice');
          await invoice.append('items', {
            item: doc.name as string,
            rate: doc.rate as Money,
            tax: doc.tax as string,
          });
          router.push(`/edit/SalesInvoice/${invoice.name}`);
        },
      },
      {
        label: fyo.t`New Bill`,
        condition: (doc) => !doc.notInserted,
        action: async (doc, router) => {
          const invoice = await fyo.doc.getNewDoc('PurchaseInvoice');
          await invoice.append('items', {
            item: doc.name as string,
            rate: doc.rate as Money,
            tax: doc.tax as string,
          });
          router.push(`/edit/PurchaseInvoice/${invoice.name}`);
        },
      },
    ];
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'unit', 'tax', 'rate'],
    };
  }
}
