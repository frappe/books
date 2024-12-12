import { Doc } from 'fyo/model/doc';
import { HiddenMap } from 'fyo/model/types';

export class ERPNextSyncSettings extends Doc {
  endpoint?: string;
  authToken?: string;
  integrationAppVersion?: string;
  isEnabled?: boolean;
  dataSyncInterval?: number;

  syncItem?: boolean;
  itemSyncType?: string;

  syncCustomer?: boolean;
  customerSyncType?: string;

  syncSupplier?: boolean;
  supplierSyncType?: string;

  syncSalesInvoice?: boolean;
  salesInvoiceSyncType?: string;

  syncSalesInvoicePayment?: boolean;
  sinvPaymentType?: string;

  syncStockMovement?: boolean;
  stockMovementSyncType?: string;

  syncPriceList?: boolean;
  priceListSyncType?: string;

  syncSerialNumber?: boolean;
  serialNumberSyncType?: string;

  syncBatch?: boolean;
  batchSyncType?: string;

  syncShipment?: boolean;
  shipmentSyncType?: string;

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
}
