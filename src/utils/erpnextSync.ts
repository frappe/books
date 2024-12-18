import { Fyo } from 'fyo';
import { sendAPIRequest } from './api';
import { ModelNameEnum } from 'models/types';
import { ERPNextSyncSettings } from 'models/baseModels/ERPNextSyncSettings/ERPNextSyncSettings';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ERPNextSyncQueue } from 'models/baseModels/ERPNextSyncQueue/ERPNextSyncQueue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { StockMovementItem } from 'models/inventory/StockMovementItem';
import { getRandomString } from '../../utils';

export async function registerInstanceToERPNext(fyo: Fyo) {
  const syncSettingsDoc = (await fyo.doc.getDoc(
    ModelNameEnum.ERPNextSyncSettings
  )) as ERPNextSyncSettings;

  const endpoint = syncSettingsDoc.endpoint;
  const token = syncSettingsDoc.authToken;
  const deviceID = syncSettingsDoc.deviceID;

  if (!endpoint || !token) {
    return;
  }

  if (!deviceID) {
    await syncSettingsDoc.setAndSync('deviceID', getRandomString());
  }

  try {
    (await sendAPIRequest(
      `${endpoint}/api/method/books_integration.api.register_instance`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance: deviceID }),
      }
    )) as unknown as ERPNextSyncSettingsAPIResponse;
  } catch (error) {
    return;
  }
}

export async function updateERPNSyncSettings(fyo: Fyo) {
  const syncSettingsDoc = (await fyo.doc.getDoc(
    ModelNameEnum.ERPNextSyncSettings
  )) as ERPNextSyncSettings;

  const endpoint = syncSettingsDoc.endpoint;
  const authToken = syncSettingsDoc.authToken;
  const deviceID = syncSettingsDoc.deviceID;

  if (!endpoint || !authToken || !deviceID) {
    return;
  }

  const res = await getERPNSyncSettings(endpoint, authToken);
  if (!res || !res.message || !res.message.success) {
    return;
  }

  await syncSettingsDoc.setMultiple(parseSyncSettingsData(res));
  await syncSettingsDoc.sync();
}

async function getERPNSyncSettings(
  endpoint: string,
  token: string
): Promise<ERPNextSyncSettingsAPIResponse | undefined> {
  try {
    return (await sendAPIRequest(
      `${endpoint}/api/method/books_integration.api.sync_settings`,
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )) as unknown as ERPNextSyncSettingsAPIResponse;
  } catch (error) {
    return;
  }
}

export function initERPNSync(fyo: Fyo) {
  const isSyncEnabled = fyo.singles.ERPNextSyncSettings?.isEnabled;
  if (!isSyncEnabled) {
    return;
  }

  const syncInterval = fyo.singles.ERPNextSyncSettings
    ?.dataSyncInterval as number;

  if (!syncInterval) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setInterval(async () => {
    await syncFetchFromERPNextQueue(fyo);
    await syncDocumentsFromERPNext(fyo);
    await syncDocumentsToERPNext(fyo);
  }, syncInterval);
}

export async function syncDocumentsFromERPNext(fyo: Fyo) {
  const isEnabled = fyo.singles.ERPNextSyncSettings?.isEnabled;
  if (!isEnabled) {
    return;
  }

  const token = fyo.singles.ERPNextSyncSettings?.authToken as string;
  const endpoint = fyo.singles.ERPNextSyncSettings?.endpoint as string;
  const deviceID = fyo.singles.ERPNextSyncSettings?.deviceID as string;

  if (!token || !endpoint) {
    return;
  }

  const docsToSync = await getDocsFromERPNext(endpoint, token, deviceID);

  if (!docsToSync || !docsToSync.message.success || !docsToSync.message.data) {
    return;
  }

  for (const doc of docsToSync.message.data) {
    if (!(getDocTypeName(doc) in ModelNameEnum)) {
      continue;
    }

    try {
      if ((doc.fbooksDocName as string) || (doc.name as string)) {
        const isDocExists = await fyo.db.exists(
          getDocTypeName(doc),
          (doc.fbooksDocName as string) || (doc.name as string)
        );

        if (isDocExists) {
          const existingDoc = await fyo.doc.getDoc(
            getDocTypeName(doc),
            (doc.fbooksDocName as string) || (doc.name as string)
          );

          await existingDoc.setMultiple(doc);
          await performPreSync(fyo, doc);
          existingDoc._addDocToSyncQueue = false;

          await existingDoc.sync();

          if (doc.submitted) {
            await existingDoc.submit();
          }

          if (doc.cancelled) {
            await existingDoc.cancel();
          }

          continue;
        }
      }
    } catch (error) {}

    try {
      const newDoc = fyo.doc.getNewDoc(getDocTypeName(doc), doc);

      await performPreSync(fyo, doc);
      newDoc._addDocToSyncQueue = false;

      await newDoc.sync();

      if (doc.submitted) {
        await newDoc.submit();
      }

      if (doc.cancelled) {
        await newDoc.cancel();
      }

      await afterDocSync(
        endpoint,
        token,
        deviceID,
        doc,
        doc.name as string,
        newDoc.name as string
      );
    } catch (error) {
      return error;
    }
  }
}

async function performPreSync(fyo: Fyo, doc: DocValueMap) {
  switch (doc.doctype) {
    case ModelNameEnum.Item:
      const isUnitExists = await fyo.db.exists(
        ModelNameEnum.UOM,
        doc.unit as string
      );

      const isUnitExistsInQueue = (
        await fyo.db.getAll(ModelNameEnum.FetchFromERPNextQueue, {
          filters: {
            referenceType: ModelNameEnum.UOM,
            documentName: doc.unit as string,
          },
        })
      ).length;

      if (!isUnitExists && !isUnitExistsInQueue) {
        await addToFetchFromERPNextQueue(fyo, {
          referenceType: ModelNameEnum.UOM,
          documentName: doc.unit,
        });
      }

      if (doc.uomConversions) {
        for (const row of doc.uomConversions as DocValueMap[]) {
          const isUnitExists = await fyo.db.exists(
            ModelNameEnum.UOM,
            row.uom as string
          );

          if (!isUnitExists && !isUnitExistsInQueue) {
            await addToFetchFromERPNextQueue(fyo, {
              referenceType: ModelNameEnum.UOM,
              documentName: row.uom,
            });
          }
        }
      }
      return;

    case 'Customer':
    case 'Supplier':
      const isAddressExists = await fyo.db.exists(
        ModelNameEnum.Address,
        doc.address as string
      );

      if (!isAddressExists) {
        await addToFetchFromERPNextQueue(fyo, {
          referenceType: ModelNameEnum.Address,
          documentName: doc.address,
        });
      }

      return;

    case ModelNameEnum.SalesInvoice:
      return await preSyncSalesInvoice(fyo, doc as SalesInvoice);

    case ModelNameEnum.StockMovement:
      if (!doc || !doc.items) {
        return;
      }

      for (const item of doc.items as StockMovementItem[]) {
        const isItemExists = await fyo.db.exists(ModelNameEnum.Item, item.item);

        if (!isItemExists) {
          await addToFetchFromERPNextQueue(fyo, {
            referenceType: ModelNameEnum.Item,
            documentName: item.item,
          });
        }
      }
      return;
    default:
      return;
  }
}

async function preSyncSalesInvoice(fyo: Fyo, doc: SalesInvoice) {
  const isPartyExists = await fyo.db.exists(
    ModelNameEnum.Party,
    doc.party as string
  );

  if (!isPartyExists) {
    await addToFetchFromERPNextQueue(fyo, {
      referenceType: ModelNameEnum.Party,
      documentName: doc.party,
    });
  }

  if (doc.items) {
    for (const item of doc.items) {
      const isUnitExists = await fyo.db.exists(ModelNameEnum.UOM, item.unit);
      if (!isUnitExists) {
        await addToFetchFromERPNextQueue(fyo, {
          referenceType: ModelNameEnum.UOM,
          documentName: item.unit,
        });
      }

      const isItemExists = await fyo.db.exists(ModelNameEnum.Item, item.item);
      if (!isItemExists) {
        await addToFetchFromERPNextQueue(fyo, {
          referenceType: ModelNameEnum.Item,
          documentName: item.item,
        });
      }

      if (item.batch) {
        const isBatchExists = await fyo.db.exists(
          ModelNameEnum.Batch,
          item.batch
        );

        if (!isBatchExists) {
          await addToFetchFromERPNextQueue(fyo, {
            referenceType: ModelNameEnum.Batch,
            documentName: item.batch,
          });
        }
      }
    }
  }

  if (doc.priceList) {
    const isPriceListExists = await fyo.db.exists(
      ModelNameEnum.PriceList,
      doc.priceList
    );

    if (!isPriceListExists) {
      await addToFetchFromERPNextQueue(fyo, {
        referenceType: ModelNameEnum.PriceList,
        documentName: doc.priceList,
      });
    }
  }
}

async function addToFetchFromERPNextQueue(fyo: Fyo, data: DocValueMap) {
  await fyo.doc.getNewDoc(ModelNameEnum.FetchFromERPNextQueue, data).sync();
}

export async function syncDocumentsToERPNext(fyo: Fyo) {
  const isEnabled = fyo.singles.ERPNextSyncSettings?.isEnabled;
  if (!isEnabled) {
    return;
  }

  const token = fyo.singles.ERPNextSyncSettings?.authToken as string;
  const endpoint = fyo.singles.ERPNextSyncSettings?.endpoint as string;
  const deviceID = fyo.singles.ERPNextSyncSettings?.deviceID as string;

  if (!token || !endpoint) {
    return;
  }

  const docsToSync = [];
  const syncQueueItems = (await fyo.db.getAll(ModelNameEnum.ERPNextSyncQueue, {
    fields: ['name', 'referenceType', 'documentName'],
    order: 'desc',
  })) as ERPNextSyncQueue[];

  if (!syncQueueItems.length) {
    return;
  }

  for (const doc of syncQueueItems) {
    const referenceDoc = await fyo.doc.getDoc(
      doc.referenceType as ModelNameEnum,
      doc.documentName
    );

    if (!referenceDoc) {
      continue;
    }

    docsToSync.push({
      doctype: getDocTypeName(referenceDoc),
      ...referenceDoc.getValidDict(),
    });
  }

  if (!docsToSync.length) {
    return;
  }

  try {
    const res = (await sendAPIRequest(
      `${endpoint}/api/method/books_integration.api.sync.sync_transactions`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance: deviceID, records: docsToSync }),
      }
    )) as unknown as InsertDocsAPIResponse;

    if (res.message.success) {
      for (const doc of syncQueueItems) {
        const syncQueueDoc = await fyo.doc.getDoc(
          ModelNameEnum.ERPNextSyncQueue,
          doc.name
        );

        await syncQueueDoc.delete();
      }
    }
  } catch (error) {
    return error;
  }
}

async function syncFetchFromERPNextQueue(fyo: Fyo) {
  const docsInQueue = await fyo.db.getAll(ModelNameEnum.FetchFromERPNextQueue, {
    fields: ['referenceType', 'documentName'],
  });

  if (!docsInQueue.length) {
    return;
  }

  const token = fyo.singles.ERPNextSyncSettings?.authToken as string;
  const endpoint = fyo.singles.ERPNextSyncSettings?.endpoint as string;
  const deviceID = fyo.singles.ERPNextSyncSettings?.deviceID as string;

  if (!token || !endpoint || !deviceID) {
    return;
  }

  try {
    const res = (await sendAPIRequest(
      `${endpoint}/api/method/books_integration.api.initiate_master_sync`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: docsInQueue, instance: deviceID }),
      }
    )) as unknown as ERPNSyncDocsResponse;

    if (!res.message.success) {
      return;
    }

    if (!res.message.success_log) {
      return;
    }

    for (const row of res.message.success_log) {
      const isDocExisitsInQueue = await fyo.db.getAll(
        ModelNameEnum.FetchFromERPNextQueue,
        {
          filters: {
            referenceType: row.doctype_name as string,
            documentName: row.document_name as string,
          },
        }
      );

      if (!isDocExisitsInQueue.length) {
        continue;
      }

      const existingDoc = await fyo.doc.getDoc(
        ModelNameEnum.FetchFromERPNextQueue,
        isDocExisitsInQueue[0].name as string
      );
      await existingDoc.delete();
    }
  } catch (error) {
    return undefined;
  }
}

async function getDocsFromERPNext(
  endpoint: string,
  token: string,
  deviceID: string
): Promise<ERPNSyncDocsResponse | undefined> {
  try {
    return (await sendAPIRequest(
      `${endpoint}/api/method/books_integration.api.get_pending_docs`,
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instance: deviceID,
        }),
      }
    )) as unknown as ERPNSyncDocsResponse;
  } catch (error) {
    return undefined;
  }
}

async function afterDocSync(
  endpoint: string,
  token: string,
  deviceID: string,
  doc: Doc | DocValueMap,
  erpnDocName: string,
  fbooksDocName: string
) {
  const res = await ipc.sendAPIRequest(
    `${endpoint}/api/method/books_integration.api.update_status`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctype: getDocTypeName(doc),
        nameInERPNext: erpnDocName,
        nameInFBooks: fbooksDocName,
        instance: deviceID,
        doc,
      }),
    }
  );
  return res;
}

export function getShouldDocSyncToERPNext(
  syncSettings: ERPNextSyncSettings,
  doc: Doc
): boolean {
  switch (doc.schemaName) {
    case ModelNameEnum.Payment:
      const isSalesPayment = doc.referenceType === ModelNameEnum.SalesInvoice;
      return (
        isSalesPayment && syncSettings.sinvPaymentType !== 'ERPNext to FBooks'
      );

    case ModelNameEnum.Party:
      const isCustomer = doc.role !== 'Supplier';

      if (isCustomer) {
        return (
          !!syncSettings.syncCustomer &&
          syncSettings.customerSyncType !== 'ERPNext to FBooks'
        );
      }

      return (
        !!syncSettings.syncSupplier &&
        syncSettings.supplierSyncType !== 'ERPNext to FBooks'
      );

    case 'PriceListItem':
      const isPriceListSyncEnabled = !!syncSettings.syncPriceList;

      return (
        isPriceListSyncEnabled &&
        syncSettings.supplierSyncType !== 'ERPNext to FBooks'
      );

    default:
      const schemaName =
        doc.schemaName[0].toLowerCase() + doc.schemaName.substring(1);

      if (!syncSettings[`${schemaName}SyncType`]) {
        return false;
      }

      return syncSettings[`${schemaName}SyncType`] !== 'ERPNext to FBooks';
  }
}

function getDocTypeName(doc: DocValueMap | Doc): string {
  const doctype =
    doc.schemaName ?? doc.referenceType ?? (doc.doctype as string);

  if (['Supplier', 'Customer'].includes(doctype as string)) {
    return ModelNameEnum.Party;
  }

  if (doctype === 'Party') {
    if (doc.role && doc.role !== 'Both') {
      return doc.role as string;
    }
  }

  return doctype as string;
}

export interface InsertDocsAPIResponse {
  message: {
    success: boolean;
    success_log: { name: string; doctype: string }[];
    failed_log: { name: string; doctype: string }[];
  };
}

export interface ERPNSyncDocsResponse {
  message: {
    success: boolean;
    data: DocValueMap[];
    success_log?: DocValueMap[];
    failed_log?: DocValueMap[];
  };
}
export interface FetchFromBooksResponse {
  message: {
    success: boolean;
    data?: DocValueMap[];
  };
}

export interface ERPNextSyncSettingsAPIResponse {
  message: {
    success: boolean;
    app_version: string;
    data: {
      name: string;
      owner: string;
      modified: string;
      modified_by: string;
      docstatus: boolean;
      idx: string;
      enable_sync: boolean;
      sync_dependant_masters: boolean;
      sync_interval: number;
      sync_item: boolean;
      item_sync_type: string;
      sync_customer: boolean;
      customer_sync_type: string;
      sync_supplier: boolean;
      supplier_sync_type: string;
      sync_sales_invoice: boolean;
      sales_invoice_sync_type: string;
      sync_sales_payment: boolean;
      sales_payment_sync_type: string;
      sync_stock: boolean;
      stock_sync_type: string;
      sync_price_list: boolean;
      price_list_sync_type: string;
      sync_serial_number: boolean;
      serial_number_sync_type: string;
      sync_batches: boolean;
      batch_sync_type: string;
      sync_delivery_note: boolean;
      delivery_note_sync_type: string;
      doctype: string;
    };
  };
}

function parseSyncSettingsData(
  res: ERPNextSyncSettingsAPIResponse
): DocValueMap {
  return {
    integrationAppVersion: res.message.app_version,
    isEnabled: !!res.message.data.enable_sync,
    dataSyncInterval: res.message.data.sync_interval,

    syncItem: res.message.data.sync_item,
    itemSyncType: res.message.data.item_sync_type,

    syncCustomer: res.message.data.sync_customer,
    customerSyncType: res.message.data.customer_sync_type,

    syncSupplier: res.message.data.sync_supplier,
    supplierSyncType: res.message.data.supplier_sync_type,

    syncSalesInvoice: res.message.data.sync_sales_invoice,
    salesInvoiceSyncType: res.message.data.sales_invoice_sync_type,

    syncSalesInvoicePayment: res.message.data.sync_sales_payment,
    sinvPaymentSyncType: res.message.data.sales_payment_sync_type,

    syncStockMovement: res.message.data.sync_stock,
    stockMovementSyncType: res.message.data.stock_sync_type,

    syncPriceList: res.message.data.sync_price_list,
    priceListSyncType: res.message.data.price_list_sync_type,

    syncSerialNumber: res.message.data.sync_serial_number,
    serialNumberSyncType: res.message.data.serial_number_sync_type,

    syncBatch: res.message.data.sync_batches,
    batchSyncType: res.message.data.batch_sync_type,

    syncShipment: res.message.data.sync_delivery_note,
    shipmentSyncType: res.message.data.delivery_note_sync_type,
  };
}
