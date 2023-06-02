import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ReadOnlyMap, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';

export class ItemPrice extends Doc {
  rate?: Money;
  validFrom?: Date;
  validUpto?: Date;

  get isBuying() {
    return !!this.parentdoc?.buying;
  }

  get isSelling() {
    return !!this.parentdoc?.selling;
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
    },
  };

  readOnly: ReadOnlyMap = {
    buying: () => !this.isBuying,
    selling: () => !this.isSelling,
  };
}
