import { ValidationMap } from 'fyo/model/types';
import { InvoiceItem } from '../InvoiceItem/InvoiceItem';

export class AppliedCouponCodes extends InvoiceItem {
  coupons?: string;

  validations: ValidationMap = {};
}
