import { Doc } from 'fyo/model/doc';
import { FiltersMap, HiddenMap } from 'fyo/model/types';
import {
  AccountRootTypeEnum,
  AccountTypeEnum,
} from 'models/baseModels/Account/types';

export class POSSettings extends Doc {
  isShiftOpen?: boolean;
  inventory?: string;
  cashAccount?: string;
  writeOffAccount?: string;
  weightEnabledBarcode?: boolean;
  checkDigits?: number;
  itemCodeDigits?: number;
  itemWeightDigits?: number;
  defaultAccount?: string;
  itemVisibility?: string;
  posUI?: 'Classic' | 'Modern';

  static filters: FiltersMap = {
    cashAccount: () => ({
      rootType: AccountRootTypeEnum.Asset,
      accountType: AccountTypeEnum.Cash,
      isGroup: false,
    }),
    defaultAccount: () => ({
      isGroup: false,
      accountType: AccountTypeEnum.Receivable,
    }),
  };

  hidden: HiddenMap = {
    weightEnabledBarcode: () =>
      !this.fyo.singles.InventorySettings?.enableBarcodes,
    checkDigits: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
    itemCodeDigits: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
    itemWeightDigits: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
  };
}
