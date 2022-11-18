import { Doc } from 'fyo/model/doc';
import { FiltersMap } from 'fyo/model/types';
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { ValuationMethod } from './types';

export class InventorySettings extends Doc {
  stockInHand?: string;
  valuationMethod?: ValuationMethod;
  stockReceivedButNotBilled?: string;
  costOfGoodsSold?: string;

  static filters: FiltersMap = {
    stockInHand: () => ({
      isGroup: false,
      accountType: AccountTypeEnum.Stock,
    }),
    stockReceivedButNotBilled: () => ({
      isGroup: false,
      accountType: AccountTypeEnum['Stock Received But Not Billed'],
    }),
    costOfGoodsSold: () => ({
      isGroup: false,
      accountType: AccountTypeEnum['Cost of Goods Sold'],
    }),
  };
}
