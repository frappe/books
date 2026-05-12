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
  image?: string;
  itemCode?: string;
  trackItem?: boolean;
  itemType?: 'Product' | 'Service';
  for?: 'Purchases' | 'Sales' | 'Both';
  hasBatch?: boolean;
  itemGroup?: string;
  hsnCode?: number;
  hasSerialNumber?: boolean;
  restockQuantity?: number;
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

  async afterSync() {
    await super.afterSync();
    if (this.image && this.image.startsWith("data:")) {
      const bucket = this.fyo.singles.SystemSettings?.imageStorageBucket;
      if (bucket) {
        // Validate image format before processing
        if (typeof this.image !== 'string' || !this.image.includes(',')) {
          console.error('Invalid data URI format: missing comma separator');
          return;
        }

        const base64Data = this.image.split(",")[1];
        if (!base64Data) {
          console.error('Invalid data URI format: missing base64 data after comma');
          return;
        }

        // Wrap upload logic in try-catch with timeout
        const uploadTimeout = 30000; // 30 seconds timeout
        try {
          const uploadPromise = (async () => {
            let response;

            if (typeof window !== 'undefined' && typeof FormData !== 'undefined') {
              // Browser environment
              const byteString = atob(base64Data);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: 'image/jpeg' });

              const formData = new FormData();
              formData.append("folder", bucket);
              formData.append("image", blob, "image.jpg");

              response = await fetch("https://rarebooks-product-images.nkonoki-charles.workers.dev/upload", {
                method: "POST",
                body: formData,
              });
            } else if (typeof require !== 'undefined') {
              // Node environment
              const FormDataNode = require("form-data");
              const formData = new FormDataNode();
              formData.append("folder", bucket);
              const buffer = Buffer.from(base64Data, "base64");
              formData.append("image", buffer, { filename: "image.jpg" });

              const nodeFetch = require("node-fetch");
              response = await nodeFetch("https://rarebooks-product-images.nkonoki-charles.workers.dev/upload", {
                method: "POST",
                body: formData
              });
            }

            if (response && response.ok) {
              const result = await response.json();
              if (result.url) {
                await this.setAndSync("image", result.url);
              }
            } else {
              console.error('Image upload failed with status:', response?.status);
            }
          })();

          // Race between upload and timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout')), uploadTimeout)
          );

          await Promise.race([uploadPromise, timeoutPromise]);
        } catch (error) {
          // Log error and skip rewriting image, leaving original data URI intact
          console.error('Image upload error:', error instanceof Error ? error.message : error);
          // Do not throw - allow lifecycle to continue
        }
      }
    }
  }

  async beforeSync(): Promise<void> {
    await super.beforeSync();
    const latestByUom = new Map<string, UOMConversionItem>();

    this.uomConversions.forEach((item) => {
      if (item.conversionFactor > 0) {
        latestByUom.set(item.uom, item);
      }
    });

    this.uomConversions = Array.from(latestByUom.values());
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
    uomConversions: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
    restockQuantity: () => !this.trackItem,
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
