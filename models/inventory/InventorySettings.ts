import { Doc } from 'fyo/model/doc';
import { FiltersMap, ReadOnlyMap } from 'fyo/model/types';
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { ValuationMethod } from './types';

export class InventorySettings extends Doc {
  defaultLocation?: string;
  stockInHand?: string;
  valuationMethod?: ValuationMethod;
  stockReceivedButNotBilled?: string;
  costOfGoodsSold?: string;
  enableBarcodes?: boolean;
  enableBatches?: boolean;
  enableSerialNumber?: boolean;
  enableUomConversions?: boolean;

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

  readOnly: ReadOnlyMap = {
    enableBarcodes: () => {
      return !!this.enableBarcodes;
    },
    enableBatches: () => {
      return !!this.enableBatches;
    },
    enableSerialNumber: () => {
      return !!this.enableSerialNumber;
    },
    enableUomConversions: () => {
      return !!this.enableUomConversions;
    },
  };
}
