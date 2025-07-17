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
import { ErrorLogEnum } from 'fyo/telemetry/types';
import { ValidationError } from 'fyo/utils/errors';
import { PricingRule } from 'models/baseModels/PricingRule/PricingRule';
import { PricingRuleItem } from 'models/baseModels/PricingRuleItem/PricingRuleItem';

export async function registerInstanceToERPNext(fyo: Fyo) {
  if (!navigator.onLine) {
    return;
  }

  const syncSettingsDoc = (await fyo.doc.getDoc(
    ModelNameEnum.ERPNextSyncSettings
  )) as ERPNextSyncSettings;

  const baseURL = syncSettingsDoc.baseURL;
  const token = syncSettingsDoc.authToken;
  let deviceID = syncSettingsDoc.deviceID;
  const instanceName = syncSettingsDoc.instanceName;

  if (!baseURL || !token) {
    return;
  }

  if (!deviceID) {
    await syncSettingsDoc.setAndSync('deviceID', getRandomString());
  }

  deviceID = syncSettingsDoc.deviceID;
  const registerInstance = fyo.singles.ERPNextSyncSettings
    ?.registerInstance as string;

  const response = (await sendAPIRequest(
    `${baseURL}/api/method/books_integration.api.${registerInstance}`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance: deviceID,
        instance_name: instanceName,
      }),
    }
  )) as unknown as ERPNextSyncSettingsAPIResponse;

  if (!response.message.success) {
    throw new ValidationError(response.message.message);
  }
}

export async function updateERPNSyncSettings(fyo: Fyo) {
  if (!navigator.onLine) {
    return;
  }

  const syncSettingsDoc = (await fyo.doc.getDoc(
    ModelNameEnum.ERPNextSyncSettings
  )) as ERPNextSyncSettings;

  const baseURL = syncSettingsDoc.baseURL;
  const authToken = syncSettingsDoc.authToken;
  const deviceID = syncSettingsDoc.deviceID;

  if (!baseURL || !authToken || !deviceID) {
    return;
  }

  const res = await getERPNSyncSettings(fyo, baseURL, authToken);
  if (!res || !res.message || !res.message.success) {
    return;
  }

  await syncSettingsDoc.setMultiple(parseSyncSettingsData(res));
  await syncSettingsDoc.sync();
}

async function getERPNSyncSettings(
  fyo: Fyo,
  baseURL: string,
  token: string
): Promise<ERPNextSyncSettingsAPIResponse | undefined> {
  const syncSettings = fyo.singles.ERPNextSyncSettings?.syncSettings as string;

  return (await sendAPIRequest(
    `${baseURL}/api/method/books_integration.api.${syncSettings}`,
    {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )) as unknown as ERPNextSyncSettingsAPIResponse;
}

export async function initERPNSync(fyo: Fyo) {
  const isSyncEnabled = fyo.singles.ERPNextSyncSettings?.isEnabled;
  if (!isSyncEnabled) {
    return;
  }

  await syncDocumentsFromERPNext(fyo);
}

export async function syncDocumentsFromERPNext(fyo: Fyo) {
  const isEnabled = fyo.singles.ERPNextSyncSettings?.isEnabled;
  if (!isEnabled) {
    return;
  }

  const token = fyo.singles.ERPNextSyncSettings?.authToken as string;
  const baseURL = fyo.singles.ERPNextSyncSettings?.baseURL as string;
  const deviceID = fyo.singles.ERPNextSyncSettings?.deviceID as string;

  if (!token || !baseURL) {
    return;
  }

  const docsToSync = await getDocsFromERPNext(fyo, baseURL, token, deviceID);
  if (!docsToSync?.message.success) {
    throw new ValidationError(docsToSync?.message.message as string);
  }
  if (!docsToSync || !docsToSync.message.success || !docsToSync.message.data) {
    return;
  }

  for (let doc of docsToSync.message.data.reverse()) {
    if (!isValidSyncableDocName(doc.doctype as string)) {
      continue;
    }
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

          doc.name = doc.fbooksDocName ?? doc.name;
          doc = checkDocDataTypes(fyo, doc) as DocValueMap;

          await existingDoc.setMultiple(doc);
          await performPreSync(fyo, doc);
          await appendDocValues(existingDoc as DocValueMap, doc);
          existingDoc._addDocToSyncQueue = false;

          await existingDoc.sync();

          if (doc.submitted) {
            await existingDoc.submit();
          }

          if (doc.cancelled) {
            await existingDoc.cancel();
          }

          await afterDocSync(
            fyo,
            baseURL,
            token,
            deviceID,
            doc,
            (doc.erpnextDocName as string) || (doc.name as string),
            doc.name as string
          );
          continue;
        }
      }
    } catch (error) {
      await fyo.doc
        .getNewDoc(ErrorLogEnum.IntegrationErrorLog, {
          error: error as string,
          data: JSON.stringify({ instance: deviceID, records: docsToSync }),
        })
        .sync();
    }

    try {
      const newDoc = fyo.doc.getNewDoc(getDocTypeName(doc), doc);

      await performPreSync(fyo, doc);
      await appendDocValues(newDoc as DocValueMap, doc);
      newDoc._addDocToSyncQueue = false;

      await newDoc.sync();

      if (doc.submitted) {
        await newDoc.submit();
      }

      if (doc.cancelled) {
        await newDoc.cancel();
      }

      await afterDocSync(
        fyo,
        baseURL,
        token,
        deviceID,
        doc,
        (doc.erpnextDocName as string) || (doc.name as string),
        newDoc.name as string
      );
    } catch (error) {}
  }
}

async function appendDocValues(newDoc: DocValueMap, doc: DocValueMap) {
  switch (doc.doctype) {
    case ModelNameEnum.Item:
      for (const uomDoc of doc.uomConversions as DocValueMap[]) {
        await (newDoc as Doc).append('uomConversions', {
          uom: uomDoc.uom,
          conversionFactor: uomDoc.conversionFactor,
        });
      }

    case ModelNameEnum.PricingRule:
      const itemSet = new Set<string>();

      (newDoc as Doc).appliedItems = (
        newDoc as PricingRule
      ).appliedItems?.filter((row: PricingRuleItem) => {
        const key = `${row.item as string}::${row.unit as string}`;

        if (itemSet.has(key)) {
          return false;
        }

        itemSet.add(key);
        return true;
      });

      const docItemSet = new Set<string>(
        (doc as PricingRule).appliedItems?.map(
          (row: PricingRuleItem) =>
            `${row.item as string}::${row.unit as string}`
        ) || []
      );

      (newDoc as PricingRule).appliedItems = (
        newDoc as PricingRule
      ).appliedItems?.filter((row: PricingRuleItem) =>
        docItemSet.has(`${row.item as string}::${row.unit as string}`)
      );
      break;
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

          if (!isUnitExists) {
            const data = {
              name: row.uom,
              isWhole: row.isWhole,
            };

            await fyo.doc.getNewDoc(ModelNameEnum.UOM, data).sync();
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
  const baseURL = fyo.singles.ERPNextSyncSettings?.baseURL as string;
  const deviceID = fyo.singles.ERPNextSyncSettings?.deviceID as string;

  if (!token || !baseURL) {
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
    const syncDataToERPNext =
      fyo.singles.ERPNextSyncSettings?.syncDataToERPNext;

    const res = (await sendAPIRequest(
      `${baseURL}/api/method/books_integration.api.${
        syncDataToERPNext as string
      }`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance: deviceID, records: docsToSync }),
      }
    )) as unknown as InsertDocsAPIResponse;

    if (!res.message.success) {
      return await fyo.doc
        .getNewDoc(ErrorLogEnum.IntegrationErrorLog, {
          error: JSON.stringify(res),
          data: JSON.stringify({ instance: deviceID, records: docsToSync }),
        })
        .sync();
    }

    for (const doc of syncQueueItems) {
      const syncQueueDoc = await fyo.doc.getDoc(
        ModelNameEnum.ERPNextSyncQueue,
        doc.name
      );

      await syncQueueDoc.delete();
    }
  } catch (error) {
    return await fyo.doc
      .getNewDoc(ErrorLogEnum.IntegrationErrorLog, {
        error: error as string,
        data: JSON.stringify({ instance: deviceID, records: docsToSync }),
      })
      .sync();
  }
}

async function getDocsFromERPNext(
  fyo: Fyo,
  baseURL: string,
  token: string,
  deviceID: string
): Promise<ERPNSyncDocsResponse | undefined> {
  const fetchFromERPNextQueue =
    fyo.singles.ERPNextSyncSettings?.fetchFromERPNextQueue;

  return (await sendAPIRequest(
    `${baseURL}/api/method/books_integration.api.${
      fetchFromERPNextQueue as string
    }?instance=${deviceID}`,
    {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )) as unknown as ERPNSyncDocsResponse;
}

async function afterDocSync(
  fyo: Fyo,
  baseURL: string,
  token: string,
  deviceID: string,
  doc: Doc | DocValueMap,
  erpnDocName: string,
  fbooksDocName: string
) {
  const data = {
    doctype: getDocTypeName(doc),
    nameInERPNext: erpnDocName,
    nameInFBooks: fbooksDocName,
    doc,
  };

  const clearSyncedDocsFromErpNextSyncQueue = fyo.singles.ERPNextSyncSettings
    ?.clearSyncedDocsFromErpNextSyncQueue as string;

  return await ipc.sendAPIRequest(
    `${baseURL}/api/method/books_integration.api.${clearSyncedDocsFromErpNextSyncQueue}`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instance: deviceID,
        data,
      }),
    }
  );
}

export function getShouldDocSyncToERPNext(doc: Doc): boolean {
  const syncableModels = [
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.Payment,
    ModelNameEnum.Shipment,
    ModelNameEnum.POSOpeningShift,
    ModelNameEnum.POSClosingShift,
  ] as string[];

  if (syncableModels.includes(doc.schemaName)) {
    return true;
  }

  return false;
}

function changeDocDataType(
  fyo: Fyo,
  doc: DocValueMap | Doc,
  fields: string[],
  type: string
): DocValueMap | Doc {
  const updatedDoc = { ...doc };

  for (const field of fields) {
    if (field in updatedDoc) {
      switch (type) {
        case ModelNameEnum.Currency:
          updatedDoc[field] = fyo.pesa(updatedDoc[field] as number);
          break;
        default:
          break;
      }
    }
  }

  return updatedDoc as DocValueMap;
}

function checkDocDataTypes(
  fyo: Fyo,
  doc: DocValueMap | Doc
): DocValueMap | Doc {
  switch (doc.doctype) {
    case ModelNameEnum.Item: {
      const fields = ['rate'];

      const updatedDoc = changeDocDataType(
        fyo,
        doc,
        fields,
        ModelNameEnum.Currency
      );

      return updatedDoc;
    }

    case ModelNameEnum.PricingRule: {
      const fields = [
        'minAmount',
        'maxAmount',
        'discountAmount',
        'discountRate',
        'freeItemRate',
      ];

      const updatedDoc = changeDocDataType(
        fyo,
        doc,
        fields,
        ModelNameEnum.Currency
      );
      return updatedDoc;
    }

    default:
      return doc;
  }
}

function isValidSyncableDocName(doctype: string): boolean {
  const syncableDocNames = [
    ModelNameEnum.Item,
    ModelNameEnum.ItemGroup,
    ModelNameEnum.Batch,
    ModelNameEnum.PricingRule,
  ] as string[];

  if (syncableDocNames.includes(doctype)) {
    return true;
  }

  return false;
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
    status: string;
    success: boolean;
    message: string;
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
    message: string;
    data: {
      name: string;
      owner: string;
      modified: string;
      modified_by: string;
      docstatus: boolean;
      idx: string;
      enable_sync: boolean;
      sync_dependant_masters: boolean;
      sync_interval: string;
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
  };
}
