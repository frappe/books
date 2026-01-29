import { Doc } from 'fyo/model/doc';
import { ChangeArg, HiddenMap } from 'fyo/model/types';
import { initERPNSync, syncDocumentsToERPNext } from 'src/utils/erpnextSync';

export class ERPNextSyncSettings extends Doc {
  deviceID?: string;
  instanceName?: string;
  baseURL?: string;
  authToken?: string;
  integrationAppVersion?: string;
  isEnabled?: boolean;
  initialSyncData?: boolean;

  dataSyncInterval?: string;
  syncDataFromServer?: boolean;
  syncDataToServer?: boolean;

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
    // syncDataFromServer: () => {
    //   return !this.deviceID;
    // },
  };

  async change(ch: ChangeArg) {
    if (ch.changed === 'syncDataFromServer') {
      const { showToast } = await import('src/utils/interactive');
      showToast({
        type: 'warning',
        message: 'Fetching data from server.',
        duration: 'very_long',
      });
      await initERPNSync(this.fyo);
      ipc.reloadWindow();
    } else if (ch.changed === 'syncDataToServer') {
      await syncDocumentsToERPNext(this.fyo);
      ipc.reloadWindow();
    }
  }
}
