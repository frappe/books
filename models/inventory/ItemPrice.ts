import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { HiddenMap, ListViewSettings, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';

export class ItemPrice extends Doc {
  item?: string;
  unit?: string;
  batch?: string;
  party?: string;
  selling?: boolean;
  buying?: boolean;
  priceList?: string;
  validFrom?: Date;
  validUpto?: Date;

  validations: ValidationMap = {
    item: async (value: DocValue) => {
      if (!this.item) return;
      const isSales = this.selling ? true : false;

      const itemExist = await this.fyo.db.getItemPrice(
        value as string,
        this.priceList!,
        undefined,
        isSales,
        this.party!,
        this.unit!,
        this.batch,
        this.validFrom,
        this.validUpto
      );

      if (itemExist) {
        throw new ValidationError(
          t`Values overlap with ItemPrice ${itemExist as string}`
        );
      }
    },
  };

  hidden: HiddenMap = {
    batch: () => !this.fyo.singles.InventorySettings?.enableBatches,
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['item', 'priceList'],
    };
  }
}
