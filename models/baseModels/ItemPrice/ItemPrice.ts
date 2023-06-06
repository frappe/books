import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { getItemPrice } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';

export class ItemPrice extends Doc {
  item?: string;
  rate?: Money;
  validFrom?: Date;
  validUpto?: Date;

  get isBuying() {
    return !!this.parentdoc?.buying;
  }

  get isSelling() {
    return !!this.parentdoc?.selling;
  }

  get priceList() {
    return this.parentdoc?.name;
  }

  validations: ValidationMap = {
    validUpto: async (value: DocValue) => {
      if (!value || !this.validFrom) {
        return;
      }
      if (value < this.validFrom) {
        throw new ValidationError(
          t`Valid From date can not be greater than Valid To date.`
        );
      }

      const itemPrice = await getItemPrice(
        this,
        this.validFrom,
        this.validUpto
      );

      if (!itemPrice) {
        return;
      }

      const priceList = (await this.fyo.getValue(
        ModelNameEnum.ItemPrice,
        itemPrice,
        'parent'
      )) as string;

      throw new ValidationError(
        t`an Item Price already exists for the given date in Price List ${priceList}`
      );
    },
  };
}
