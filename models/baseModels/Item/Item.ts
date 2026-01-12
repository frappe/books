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

interface UOMConversionItem {
  name: string;
  uom: string;
  conversionFactor: number;
}

export class Item extends Doc {
  itemCode?: string;
  trackItem?: boolean;
  itemType?: 'Product' | 'Service';
  for?: 'Purchases' | 'Sales' | 'Both';
  hasBatch?: boolean;
  itemGroup?: string;
  hsnCode?: number;
  hasSerialNumber?: boolean;
  serialNumberSeries?: string;
  uomConversions: UOMConversionItem[] = [];

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
    hsnCode: {
      formula: async () => {
        if (!this.itemGroup) {
          return '';
        }

        const itemGroupDoc = await this.fyo.doc.getDoc(
          'ItemGroup',
          this.itemGroup
        );
        return itemGroupDoc?.hsnCode as string;
      },
      dependsOn: ['itemGroup'],
    },
  };

  async beforeSync(): Promise<void> {
    await super.beforeSync();
    const latestByUom = new Map<string, UOMConversionItem>();

    this.uomConversions.forEach((item) => {
      if (item.conversionFactor > 0) {
        latestByUom.set(item.uom, item);
      }
    });

    this.uomConversions = Array.from(latestByUom.values());

    if (this.serialNumberSeries && this.hasSerialNumber) {
      const series = this.serialNumberSeries.trim();
      if (series && !series.endsWith('-')) {
        this.serialNumberSeries = series + '-';
      }
    }
  }

  async afterSync(): Promise<void> {
    await super.afterSync();

    if (this.hasSerialNumber && this.serialNumberSeries) {
      const seriesName = this.serialNumberSeries?.trim();

      if (!seriesName) {
        return;
      }

      const exists = await this.fyo.db.exists('SerialNumberSeries', seriesName);

      if (!exists) {
        await this.fyo.doc
          .getNewDoc('SerialNumberSeries', {
            name: seriesName,
            start: 1001,
            padZeros: 4,
            current: 1000,
          })
          .sync();
      }
    }
  }

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
    barcode: (value: DocValue) => {
      if (value && !(value as string).match(/^\d{12}$/)) {
        throw new ValidationError(
          this.fyo.t`Barcode must be exactly 12 digits.`
        );
      }
    },
    rate: (value: DocValue) => {
      if ((value as Money).isNegative()) {
        throw new ValidationError(this.fyo.t`Rate can't be negative.`);
      }
    },
    hsnCode: (value: DocValue) => {
      if (value && !(value as string).match(/^\d{4,8}$/)) {
        throw new ValidationError(this.fyo.t`Invalid HSN Code.`);
      }
    },
    serialNumberSeries: (value: DocValue) => {
      if (!value) {
        return;
      }

      const series = (value as string).trim();
      const invalidChars = /[/\=\?\&\%]/;

      if (invalidChars.test(series)) {
        throw new ValidationError(
          this.fyo
            .t`Serial Number Series cannot contain the following characters: /, ?, &, =, %`
        );
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
    hasBatch: () => !this.fyo.singles.InventorySettings?.enableBatches,
    hasSerialNumber: () =>
      !(
        this.fyo.singles.InventorySettings?.enableSerialNumber && this.trackItem
      ),
    serialNumberSeries: () => !this.hasSerialNumber,
    uomConversions: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
    itemGroup: () => !this.fyo.singles.AccountingSettings?.enableitemGroup,
  };

  readOnly: ReadOnlyMap = {
    unit: () => this.inserted,
    itemType: () => this.inserted,
    trackItem: () => this.inserted,
    hasBatch: () => this.inserted,
    hasSerialNumber: () => this.inserted,
  };
}
