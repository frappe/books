import { PricingRule } from '../PricingRule/PricingRule';

export interface ApplicablePricingRules {
  applyOnItem: string;
  pricingRule: PricingRule;
}

export interface ApplicableCouponCodes {
  pricingRule: string;
  coupon: string;
}
