import { Doc } from 'fyo/model/doc';
import { ChangeArg, HiddenMap } from 'fyo/model/types';
import { initERPNSync, syncDocumentsToERPNext } from 'src/utils/erpnextSync';
import { ErrorLogEnum } from 'fyo/telemetry/types';

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
  };

  async change(ch: ChangeArg) {
    if (ch.changed === 'syncDataFromServer') {
      try {
        const { showToast } = await import('src/utils/interactive');
        showToast({
          type: 'warning',
          message: 'Fetching data from server.',
          duration: 'very_long',
        });
        await initERPNSync(this.fyo);
        ipc.reloadWindow();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        try {
          await this.fyo.doc
            .getNewDoc(ErrorLogEnum.IntegrationErrorLog, {
              error: errorMessage,
              data: JSON.stringify({
                instance: this.deviceID,
                operation: 'sync_data_from_server',
                trigger: 'change_event',
              }),
            })
            .sync();
        } catch (logError) {
          throw logError;
        }
      }
    } else if (ch.changed === 'syncDataToServer') {
      try {
        await syncDocumentsToERPNext(this.fyo);
        ipc.reloadWindow();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        try {
          await this.fyo.doc
            .getNewDoc(ErrorLogEnum.IntegrationErrorLog, {
              error: errorMessage,
              data: JSON.stringify({
                instance: this.deviceID,
                operation: 'sync_data_to_server',
                trigger: 'change_event',
              }),
            })
            .sync();
        } catch (logError) {
          throw logError;
        }
      }
    }
  }
}
