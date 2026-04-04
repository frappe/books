import { DocValue } from 'fyo/core/types';
import { ValidationMap } from 'fyo/model/types';
import { InvoiceItem } from '../InvoiceItem/InvoiceItem';
import { validateCouponCode } from 'models/helpers';

export class AppliedCouponCodes extends InvoiceItem {
  coupons?: string;

  validations: ValidationMap = {
    coupons: async (value: DocValue) => {
      if (!value) {
        return;
      }

      await validateCouponCode(this as AppliedCouponCodes, value as string);
    },
  };
}
