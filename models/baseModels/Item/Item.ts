import { Fyo } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  FiltersMap,
  FormulaMap,
  HiddenMap,
  ListViewSettings,
  ReadOnlyMap,
  ValidationMap,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';
import { AccountRootTypeEnum, AccountTypeEnum } from '../Account/types';

export class Item extends Doc {
  trackItem?: boolean;
  itemType?: 'Product' | 'Service';
  for?: 'Purchases' | 'Sales' | 'Both';
  hasBatch?: boolean;
  hasSerialNumber?: boolean;

  formulas: FormulaMap = {
    incomeAccount: {
      formula: async () => {
        let accountName = 'Service';
        if (this.itemType === 'Product') {
          accountName = 'Sales';
        }

        const accountExists = await this.fyo.db.exists('Account', accountName);
        return accountExists ? accountName : '';
      },
      dependsOn: ['itemType'],
    },
    expenseAccount: {
      formula: async () => {
        if (this.trackItem) {
          return this.fyo.singles.InventorySettings
            ?.stockReceivedButNotBilled as string;
        }

        const cogs = await this.fyo.db.getAllRaw('Account', {
          filters: {
            accountType: AccountTypeEnum['Cost of Goods Sold'],
          },
        });

        if (cogs.length === 0) {
          return '';
        } else {
          return cogs[0].name as string;
        }
      },
      dependsOn: ['itemType', 'trackItem'],
    },
  };

  static filters: FiltersMap = {
    incomeAccount: () => ({
      isGroup: false,
      rootType: AccountRootTypeEnum.Income,
    }),
    expenseAccount: (doc) => ({
      isGroup: false,
      rootType: doc.trackItem
        ? AccountRootTypeEnum.Liability
        : AccountRootTypeEnum.Expense,
    }),
  };

  validations: ValidationMap = {
    rate: (value: DocValue) => {
      if ((value as Money).isNegative()) {
        throw new ValidationError(this.fyo.t`Rate can't be negative.`);
      }
    },
  };

  static getActions(fyo: Fyo): Action[] {
    return [
      {
        group: fyo.t`Create`,
        label: fyo.t`Sales Invoice`,
        condition: (doc) => !doc.notInserted && doc.for !== 'Purchases',
        action: async (doc, router) => {
          const invoice = fyo.doc.getNewDoc('SalesInvoice');
          await invoice.append('items', {
            item: doc.name as string,
            rate: doc.rate as Money,
            tax: doc.tax as string,
          });
          await router.push(`/edit/SalesInvoice/${invoice.name!}`);
        },
      },
      {
        group: fyo.t`Create`,
        label: fyo.t`Purchase Invoice`,
        condition: (doc) => !doc.notInserted && doc.for !== 'Sales',
        action: async (doc, router) => {
          const invoice = fyo.doc.getNewDoc('PurchaseInvoice');
          await invoice.append('items', {
            item: doc.name as string,
            rate: doc.rate as Money,
            tax: doc.tax as string,
          });
          await router.push(`/edit/PurchaseInvoice/${invoice.name!}`);
        },
      },
    ];
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'unit', 'tax', 'rate'],
    };
  }

  hidden: HiddenMap = {
    trackItem: () =>
      !this.fyo.singles.AccountingSettings?.enableInventory ||
      this.itemType !== 'Product' ||
      (this.inserted && !this.trackItem),
    barcode: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
    hasBatch: () =>
      !(this.fyo.singles.InventorySettings?.enableBatches && this.trackItem),
    hasSerialNumber: () =>
      !(
        this.fyo.singles.InventorySettings?.enableSerialNumber && this.trackItem
      ),
    uomConversions: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
  };

  readOnly: ReadOnlyMap = {
    unit: () => this.inserted,
    itemType: () => this.inserted,
    trackItem: () => this.inserted,
    hasBatch: () => this.inserted,
    hasSerialNumber: () => this.inserted,
  };
}
