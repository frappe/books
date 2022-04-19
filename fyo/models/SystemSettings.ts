import { DocValue } from 'fyo/core/types';
import Doc from 'fyo/model/doc';
import { ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { t } from 'fyo/utils/translation';

export default class SystemSettings extends Doc {
  validations: ValidationMap = {
    async displayPrecision(value: DocValue) {
      if ((value as number) >= 0 && (value as number) <= 9) {
        return;
      }

      throw new ValidationError(
        t`Display Precision should have a value between 0 and 9.`
      );
    },
  };
}
