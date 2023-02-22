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
  hasBatchNumber?: boolean;

  async beforeSync() {
    /*
      * This code block is to prevent users from changing the value of Has Batch No Checkbox
        of the items which already did transactions
      * allowing users to change the value of Has Batch No of the items which already did
        transactions will result in incorect SLEs 
    */
    const ifItemHasBatchNumber = await this.fyo.db.get(
      'Item',
      this.name!,
      'hasBatchNumber'
    );

    if (this.hasBatchNumber == ifItemHasBatchNumber.hasBatchNumber) {
      return;
    }

    const isItemExistsInSLE = await this.fyo.db.itemHasTransactions(this.name!);

    if (isItemExistsInSLE) {
      throw new ValidationError(
        this.fyo.t`Cannot change value of Has Batch No as ${this
          .name!} already has transactions against it. `
      );
    }
  }

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
    rate: async (value: DocValue) => {
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
        group: fyo.t`Create`,
        label: fyo.t`Purchase Invoice`,
        condition: (doc) => !doc.notInserted && doc.for !== 'Sales',
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
      formRoute: ({ name }) => `/edit/Item/${name}`,
      columns: ['name', 'unit', 'tax', 'rate'],
    };
  }

  hidden: HiddenMap = {
    trackItem: () =>
      !this.fyo.singles.AccountingSettings?.enableInventory ||
      this.itemType !== 'Product' ||
      (this.inserted && !this.trackItem),
    hasBatchNumber: () => !this.trackItem || false,
    barcode: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
    uomConversions: () => !this.fyo.singles.AccountingSettings?.enableInventory,
  };

  readOnly: ReadOnlyMap = {
    unit: () => this.inserted,
    itemType: () => this.inserted,
    trackItem: () => this.inserted,
  };
}
