import { DocValue } from 'frappe/core/types';
import Doc from 'frappe/model/doc';
import { ValidationMap } from 'frappe/model/types';
import { ValidationError } from 'frappe/utils/errors';
import { t } from 'frappe/utils/translation';

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
