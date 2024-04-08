import { Doc } from 'fyo/model/doc';
import { SchemaMap } from 'schemas/types';
import { ListsMap, ListViewSettings, ReadOnlyMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Fyo } from 'fyo';

export class PrintTemplate extends Doc {
  name?: string;
  type?: string;
  width?: number;
  height?: number;
  template?: string;
  isCustom?: boolean;

  override get canDelete(): boolean {
    if (this.isCustom === false) {
      return false;
    }

    return super.canDelete;
  }

  static getListViewSettings(fyo: Fyo): ListViewSettings {
    return {
      formRoute: (name) => `/template-builder/${name}`,
      columns: [
        'name',
        {
          label: fyo.t`Type`,
          fieldtype: 'AutoComplete',
          fieldname: 'type',
          display(value) {
            return fyo.schemaMap[value as string]?.label ?? '';
          },
        },
        'isCustom',
      ],
    };
  }

  readOnly: ReadOnlyMap = {
    name: () => !this.isCustom,
    type: () => !this.isCustom,
    template: () => !this.isCustom,
  };

  static lists: ListsMap = {
    type(doc?: Doc) {
      let enableInventory = false;
      let schemaMap: SchemaMap = {};
      if (doc) {
        enableInventory = !!doc.fyo.singles.AccountingSettings?.enableInventory;
        schemaMap = doc.fyo.schemaMap;
      }

      const models = [
        ModelNameEnum.SalesInvoice,
        ModelNameEnum.SalesQuote,
        ModelNameEnum.PurchaseInvoice,
        ModelNameEnum.JournalEntry,
        ModelNameEnum.Payment,
      ];

      if (enableInventory) {
        models.push(
          ModelNameEnum.Shipment,
          ModelNameEnum.PurchaseReceipt,
          ModelNameEnum.StockMovement
        );
      }

      return models.map((value) => ({
        value,
        label: schemaMap[value]?.label ?? value,
      }));
    },
  };

  override duplicate(): Doc {
    const doc = super.duplicate() as PrintTemplate;
    doc.isCustom = true;
    return doc;
  }
}
