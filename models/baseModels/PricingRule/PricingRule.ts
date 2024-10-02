import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';
import { PricingRuleItem } from '../PricingRuleItem/PricingRuleItem';
import { getIsDocEnabledColumn } from 'models/helpers';
import {
  HiddenMap,
  ListViewSettings,
  RequiredMap,
  ValidationMap,
} from 'fyo/model/types';
import { DocValue } from 'fyo/core/types';
import { ValidationError } from 'fyo/utils/errors';
import { t } from 'fyo';

export class PricingRule extends Doc {
  isEnabled?: boolean;
  title?: string;
  appliedItems?: PricingRuleItem[];
  discountType?: 'Price Discount' | 'Product Discount';

  priceDiscountType?: 'rate' | 'percentage' | 'amount';
  discountRate?: Money;
  discountPercentage?: number;
  discountAmount?: Money;

  isCouponCodeBased?: boolean;

  forPriceList?: string;

  freeItem?: string;
  freeItemQuantity?: number;
  freeItemUnit?: string;
  freeItemRate?: Money;
  roundFreeItemQty?: number;
  roundingMethod?: string;

  isRecursive?: boolean;
  recurseEvery?: number;
  recurseOver?: number;

  minQuantity?: number;
  maxQuantity?: number;

  minAmount?: Money;
  maxAmount?: Money;

  validFrom?: Date;
  validTo?: Date;

  thresholdForSuggestion?: number;
  priority?: number;

  get isDiscountTypeIsPriceDiscount() {
    return this.discountType === 'Price Discount';
  }

  validations: ValidationMap = {
    minQuantity: (value: DocValue) => {
      if (!value || !this.maxQuantity) {
        return;
      }

      if ((value as number) > this.maxQuantity) {
        throw new ValidationError(
          t`Minimum Quantity should be less than the Maximum Quantity.`
        );
      }
    },
    maxQuantity: (value: DocValue) => {
      if (!this.minQuantity || !value) {
        return;
      }

      if ((value as number) < this.minQuantity) {
        throw new ValidationError(
          t`Maximum Quantity should be greater than the Minimum Quantity.`
        );
      }
    },
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

  required: RequiredMap = {
    priceDiscountType: () => this.isDiscountTypeIsPriceDiscount,
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'title', getIsDocEnabledColumn(), 'discountType'],
    };
  }

  hidden: HiddenMap = {
    location: () => !this.fyo.singles.AccountingSettings?.enableInventory,

    priceDiscountType: () => !this.isDiscountTypeIsPriceDiscount,
    discountRate: () =>
      !this.isDiscountTypeIsPriceDiscount || this.priceDiscountType !== 'rate',
    discountPercentage: () =>
      !this.isDiscountTypeIsPriceDiscount ||
      this.priceDiscountType !== 'percentage',
    discountAmount: () =>
      !this.isDiscountTypeIsPriceDiscount ||
      this.priceDiscountType !== 'amount',
    forPriceList: () =>
      !this.isDiscountTypeIsPriceDiscount || this.priceDiscountType === 'rate',

    freeItem: () => this.isDiscountTypeIsPriceDiscount,
    freeItemQuantity: () => this.isDiscountTypeIsPriceDiscount,
    freeItemUnit: () => this.isDiscountTypeIsPriceDiscount,
    freeItemRate: () => this.isDiscountTypeIsPriceDiscount,
    roundFreeItemQty: () => this.isDiscountTypeIsPriceDiscount,
    roundingMethod: () =>
      this.isDiscountTypeIsPriceDiscount || !this.roundFreeItemQty,
    isRecursive: () => this.isDiscountTypeIsPriceDiscount,
    recurseEvery: () => this.isDiscountTypeIsPriceDiscount || !this.isRecursive,
    recurseOver: () => this.isDiscountTypeIsPriceDiscount || !this.isRecursive,
  };
}
