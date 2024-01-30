import { Doc } from 'fyo/model/doc';
import { Money } from 'pesa';
import { PricingRuleItem } from '../PricingRuleItem/PricingRuleItem';
import { getIsDocEnabledColumn } from 'models/helpers';
import {
  FiltersMap,
  FormulaMap,
  HiddenMap,
  ListViewSettings,
  RequiredMap,
  ValidationMap,
} from 'fyo/model/types';

export class PricingRule extends Doc {
  isEnabled?: boolean;
  title?: string;
  appliedItems?: PricingRuleItem[];
  discountType?: 'Price Discount' | 'Product Discount';

  priceDiscountType?: 'rate' | 'percentage' | 'amount';
  discountRate?: Money;
  discountPercentage?: number;
  discountAmount?: Money;

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

  formulas: FormulaMap = {};

  validations: ValidationMap = {};

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

  static filters: FiltersMap = {};
}
