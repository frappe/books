import { Doc } from 'fyo/model/doc';
import { FiltersMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export class POSProfile extends Doc {
  posProfile?: string;
  posCustomer?: string;
  defaultLocation?: string;
  posPrintTemplate?: string;
  inventory?: string;
  posUI?: 'Classic' | 'Modern';
  isShiftOpen?: boolean;
  itemVisibility?: string;
  canChangeRate?: boolean;
  hideUnavailableItems?: boolean;
  canEditDiscount?: boolean;
  ignorePricingRule?: boolean;

  static filters: FiltersMap = {
    posPrintTemplate: () => ({ type: ModelNameEnum.SalesInvoice }),
  };
}
