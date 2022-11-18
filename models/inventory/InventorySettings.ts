import { Doc } from 'fyo/model/doc';
import { FiltersMap } from 'fyo/model/types';
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { valuationMethod } from './types';

export class InventorySettings extends Doc {
  stockInHand?: string;
  valuationMethod?: valuationMethod;
  stockInReceivedButNotBilled?: string;

  static filters: FiltersMap = {
    stockInHand: () => ({
      isGroup: false,
      accountType: AccountTypeEnum.Stock,
    }),
    stockReceivedButNotBilled: () => ({
      isGroup: false,
      accountType: AccountTypeEnum['Stock Received But Not Billed'],
    }),
  };
}
