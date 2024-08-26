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

export class CouponCode extends Doc {
  name?: string;
  couponName?: string;
  pricingRule?: string;

  validFrom?: Date;
  validTo?: Date;

  minAmount?: Money;
  maxAmount?: Money;

  formulas: FormulaMap = {
    name: {
      formula: () => {
        return this.couponName?.replace(/\s+/g, '').toUpperCase().slice(0, 8);
      },
      dependsOn: ['couponName'],
    },
  };

  validations: ValidationMap = {
    minAmount: (value: DocValue) => {
      if (!value || !this.maxAmount) {
        return;
      }

      if ((value as Money).isZero() && this.maxAmount.isZero()) {
        return;
      }

      if ((value as Money).gte(this.maxAmount)) {
        throw new ValidationError(
          t`Minimum Amount should be less than the Maximum Amount.`
        );
      }
    },
    maxAmount: (value: DocValue) => {
      if (!this.minAmount || !value) {
        return;
      }

      if (this.minAmount.isZero() && (value as Money).isZero()) {
        return;
      }

      if ((value as Money).lte(this.minAmount)) {
        throw new ValidationError(
          t`Maximum Amount should be greater than the Minimum Amount.`
        );
      }
    },
    validFrom: (value: DocValue) => {
      if (!value || !this.validTo) {
        return;
      }

      if ((value as Date).toISOString() > this.validTo.toISOString()) {
        throw new ValidationError(
          t`Valid From Date should be less than Valid To Date.`
        );
      }
    },
    validTo: (value: DocValue) => {
      if (!this.validFrom || !value) {
        return;
      }

      if ((value as Date).toISOString() < this.validFrom.toISOString()) {
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
