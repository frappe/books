import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { HiddenMap } from 'fyo/model/types';
import { ListViewSettings, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { getPriceListStatusColumn } from 'models/helpers';

export class ItemPrice extends Doc {
  item?: string;
  unit?: string;
  batch?: string;
  party?: string;
  buying?: boolean;
  selling?: boolean;
  priceList?: string;
  validFrom?: Date;
  validUpto?: Date;

  validations: ValidationMap = {
    item: async (value: DocValue) => {
      if (
        !value ||
        !this.item ||
        !this.priceList ||
        !this.party ||
        !this.unit ||
        !this.validFrom ||
        !this.validUpto
      ) {
        return;
      }

      const itemPrice = await this.fyo.db.getItemPrice(
        value as string,
        this.priceList,
        this.validFrom,
        this.validUpto,
        this.party,
        this.unit,
        this.batch
      );

      if (!itemPrice) {
        return;
      }

      if (itemPrice === this.name) {
        return;
      }

      if (itemPrice) {
        throw new ValidationError(
          t`Item Price ${itemPrice as string} exists for the given date.`
        );
      }
    },
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'item',
        getPriceListStatusColumn(),
        'priceList',
        'party',
        'rate',
      ],
    };
  }

  hidden: HiddenMap = {
    batch: () => !this.fyo.singles.InventorySettings?.enableBatches,
  };
}
