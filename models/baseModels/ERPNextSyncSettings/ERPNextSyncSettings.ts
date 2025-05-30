import { Doc } from 'fyo/model/doc';
import { ChangeArg, HiddenMap } from 'fyo/model/types';
import { initERPNSync } from 'src/utils/erpnextSync';

export class ERPNextSyncSettings extends Doc {
  deviceID?: string;
  instanceName?: string;
  baseURL?: string;
  authToken?: string;
  integrationAppVersion?: string;
  isEnabled?: boolean;

  dataSyncInterval?: string;
  syncDataFromServer?: boolean;

  registerInstance?: string;
  syncSettings?: string;
  syncDataToERPNext?: string;
  fetchFromERPNextQueue?: string;
  clearSyncedDocsFromErpNextSyncQueue?: string;

  hidden: HiddenMap = {
    syncPriceList: () => {
      return !this.fyo.singles.AccountingSettings?.enablePriceList;
    },
    priceListSyncType: () => {
      return !this.fyo.singles.AccountingSettings?.enablePriceList;
    },
    syncSerialNumber: () => {
      return !this.fyo.singles.InventorySettings?.enableSerialNumber;
    },
    serialNumberSyncType: () => {
      return !this.fyo.singles.InventorySettings?.enableSerialNumber;
    },
    syncBatch: () => {
      return !this.fyo.singles.InventorySettings?.enableBatches;
    },
    batchSyncType: () => {
      return !this.fyo.singles.InventorySettings?.enableBatches;
    },
  };

  async change(ch: ChangeArg) {
    if (ch.changed === 'syncDataFromServer') {
      await initERPNSync(this.fyo);
      ipc.reloadWindow();
    }
  }
}
