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
  checkDigit?: number;
  itemCodeDigits?: number;
  itemWeight?: number;

  posUI?: 'Classic' | 'Modern';

  static filters: FiltersMap = {
    cashAccount: () => ({
      rootType: AccountRootTypeEnum.Asset,
      accountType: AccountTypeEnum.Cash,
      isGroup: false,
    }),
  };

  hidden: HiddenMap = {
    weightEnabledBarcode: () =>
      !this.fyo.singles.InventorySettings?.enableBarcodes,
    checkDigit: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
    itemCodeDigits: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
    itemWeight: () => !this.fyo.singles.InventorySettings?.enableBarcodes,
  };
}
