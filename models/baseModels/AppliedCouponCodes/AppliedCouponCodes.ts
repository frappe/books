import { DocValue } from 'fyo/core/types';
import { ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { InvoiceItem } from '../InvoiceItem/InvoiceItem';
import { getApplicableCouponCodesName } from 'models/helpers';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';

export class AppliedCouponCodes extends InvoiceItem {
  coupons?: string;

  validations: ValidationMap = {
    coupons: async (value: DocValue) => {
      if (!value) {
        return;
      }

      const coupon = await this.fyo.db.getAll(ModelNameEnum.CouponCode, {
        fields: [
          'minAmount',
          'maxAmount',
          'pricingRule',
          'validFrom',
          'validTo',
          'maximumUse',
          'used',
        ],
        filters: { name: value as string },
      });

      if ((coupon[0]?.maximumUse as number) <= (coupon[0]?.used as number)) {
        throw new ValidationError(
          'Coupon code has been used maximum number of times'
        );
      }

      const applicableCouponCodesNames = await getApplicableCouponCodesName(
        value as string,
        this.parentdoc as SalesInvoice
      );

      if (!applicableCouponCodesNames?.length) {
        throw new ValidationError(
          this.fyo.t`Coupon ${
            value as string
          } is not applicable for applied items.`
        );
      }

      const couponExist = this.parentdoc?.coupons?.some(
        (coupon) => coupon?.coupons === value
      );

      if (couponExist) {
        throw new ValidationError(
          this.fyo.t`${value as string} already applied.`
        );
      }

      if (
        (coupon[0].minAmount as Money).gte(
          this.parentdoc?.grandTotal as Money
        ) &&
        !(coupon[0].minAmount as Money).isZero()
      ) {
        throw new ValidationError(
          this.fyo.t`The Grand Total must exceed ${
            (coupon[0].minAmount as Money).float
          } to apply the coupon ${value as string}.`
        );
      }

      if (
        (coupon[0].maxAmount as Money).lte(
          this.parentdoc?.grandTotal as Money
        ) &&
        !(coupon[0].maxAmount as Money).isZero()
      ) {
        throw new ValidationError(
          this.fyo.t`The Grand Total must be less than ${
            (coupon[0].maxAmount as Money).float
          } to apply this coupon.`
        );
      }

      if ((coupon[0].validFrom as Date) > (this.parentdoc?.date as Date)) {
        throw new ValidationError(
          this.fyo.t`Valid From Date should be less than Valid To Date.`
        );
      }

      if ((coupon[0].validTo as Date) < (this.parentdoc?.date as Date)) {
        throw new ValidationError(
          this.fyo.t`Valid To Date should be greater than Valid From Date.`
        );
      }
    },
  };
}
