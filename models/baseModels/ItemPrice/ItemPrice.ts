import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { Money } from 'pesa';

export class ItemPrice extends Doc {
  rate?: Money;
  validFrom?: Date;
  validUpto?: Date;

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
}
