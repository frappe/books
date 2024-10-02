import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  FiltersMap,
  FormulaMap,
  ListViewSettings,
  ValidationMap,
} from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { t } from 'fyo';
import { Money } from 'pesa';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { ApplicableCouponCodes } from '../Invoice/types';

export class CouponCode extends Doc {
  name?: string;
  couponName?: string;
  pricingRule?: string;

  validFrom?: Date;
  validTo?: Date;

  minAmount?: Money;
  maxAmount?: Money;

  removeUnusedCoupons(coupons: ApplicableCouponCodes[], sinvDoc: SalesInvoice) {
    if (!coupons.length) {
      sinvDoc.coupons = [];

      return;
    }

    sinvDoc.coupons = sinvDoc.coupons!.filter((coupon) => {
      return coupons.find((c: ApplicableCouponCodes) =>
        coupon?.coupons?.includes(c?.coupon)
      );
    });
  }

  formulas: FormulaMap = {
    name: {
      formula: () => {
        return this.couponName?.replace(/\s+/g, '').toUpperCase().slice(0, 8);
      },
      dependsOn: ['couponName'],
    },
  };

  async pricingRuleData() {
    return await this.fyo.db.getAll(ModelNameEnum.PricingRule, {
      fields: ['minAmount', 'maxAmount', 'validFrom', 'validTo'],
      filters: {
        name: this.pricingRule as string,
      },
    });
  }

  validations: ValidationMap = {
    minAmount: async (value: DocValue) => {
      if (!value || !this.maxAmount || !this.pricingRule) {
        return;
      }

      const [pricingRuleData] = await this.pricingRuleData();

      if (
        (pricingRuleData?.minAmount as Money).isZero() &&
        (pricingRuleData.maxAmount as Money).isZero()
      ) {
        return;
      }

      const { minAmount } = pricingRuleData;

      if ((value as Money).isZero() && this.maxAmount.isZero()) {
        return;
      }

      if ((value as Money).lt(minAmount as Money)) {
        throw new ValidationError(
          t`Minimum Amount should be greather than the Pricing Rule's Minimum Amount.`
        );
      }

      if ((value as Money).gte(this.maxAmount)) {
        throw new ValidationError(
          t`Minimum Amount should be less than the Maximum Amount.`
        );
      }
    },
    maxAmount: async (value: DocValue) => {
      if (!this.minAmount || !value || !this.pricingRule) {
        return;
      }

      const [pricingRuleData] = await this.pricingRuleData();

      if (
        (pricingRuleData?.minAmount as Money).isZero() &&
        (pricingRuleData.maxAmount as Money).isZero()
      ) {
        return;
      }

      const { maxAmount } = pricingRuleData;

      if (this.minAmount.isZero() && (value as Money).isZero()) {
        return;
      }

      if ((value as Money).gt(maxAmount as Money)) {
        throw new ValidationError(
          t`Maximum Amount should be lesser than Pricing Rule's Maximum Amount`
        );
      }

      if ((value as Money).lte(this.minAmount)) {
        throw new ValidationError(
          t`Maximum Amount should be greater than the Minimum Amount.`
        );
      }
    },
    validFrom: async (value: DocValue) => {
      if (!value || !this.validTo || !this.pricingRule) {
        return;
      }

      const [pricingRuleData] = await this.pricingRuleData();

      if (!pricingRuleData?.validFrom && !pricingRuleData.validTo) {
        return;
      }

      const { validFrom } = pricingRuleData;
      if (
        validFrom &&
        (value as Date).toISOString() < (validFrom as Date).toISOString()
      ) {
        throw new ValidationError(
          t`Valid From Date should be greather than Pricing Rule's Valid From Date.`
        );
      }

      if ((value as Date).toISOString() >= this.validTo.toISOString()) {
        throw new ValidationError(
          t`Valid From Date should be less than Valid To Date.`
        );
      }
    },
    validTo: async (value: DocValue) => {
      if (!this.validFrom || !value || !this.pricingRule) {
        return;
      }

      const [pricingRuleData] = await this.pricingRuleData();

      if (!pricingRuleData?.validFrom && !pricingRuleData.validTo) {
        return;
      }

      const { validTo } = pricingRuleData;

      if (
        validTo &&
        (value as Date).toISOString() > (validTo as Date).toISOString()
      ) {
        throw new ValidationError(
          t`Valid To Date should be lesser than Pricing Rule's Valid To Date.`
        );
      }

      if ((value as Date).toISOString() <= this.validFrom.toISOString()) {
        throw new ValidationError(
          t`Valid To Date should be greater than Valid From Date.`
        );
      }
    },
  };

  static filters: FiltersMap = {
    pricingRule: () => ({
      isCouponCodeBased: true,
    }),
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'couponName', 'pricingRule', 'maximumUse', 'used'],
    };
  }
}
