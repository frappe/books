import config, { ConfigFile, ConfigKeys, TelemetrySetting } from '@/config';
import { IPC_ACTIONS } from '@/messages';
import { ipcRenderer } from 'electron';
import frappe, { t } from 'frappe';
import { DoctypeName } from '../../models/types';
import { Count, UniqueId } from './types';

export function getId(): string {
  let id: string = '';

  for (let i = 0; i < 4; i++) {
    id += Math.random().toString(36).slice(2, 9);
  }

  return id;
}

export function getCountry(): string {
  // @ts-ignore
  return frappe.AccountingSettings?.country ?? '';
}

export function getLanguage(): string {
  return config.get('language') as string;
}

export async function getCounts(): Promise<Count> {
  const interestingDocs = [
    DoctypeName.Payment,
    DoctypeName.PaymentFor,
    DoctypeName.SalesInvoice,
    DoctypeName.SalesInvoiceItem,
    DoctypeName.PurchaseInvoice,
    DoctypeName.PurchaseInvoiceItem,
    DoctypeName.JournalEntry,
    DoctypeName.JournalEntryAccount,
    DoctypeName.Account,
    DoctypeName.Tax,
  ];

  const countMap: Count = {};
  // @ts-ignore
  if (frappe.db === undefined) {
    return countMap;
  }

  type CountResponse = { 'count(*)': number }[];
  for (const name of interestingDocs) {
    // @ts-ignore
    const queryResponse: CountResponse = await frappe.db.knex(name).count();
    const count: number = queryResponse[0]['count(*)'];
    countMap[name] = count;
  }

  // @ts-ignore
  const supplierCount: CountResponse = await frappe.db
    .knex('Party')
    .count()
    .where({ supplier: 1 });

  // @ts-ignore
  const customerCount: CountResponse = await frappe.db
    .knex('Party')
    .count()
    .where({ customer: 1 });

  countMap[DoctypeName.Customer] = customerCount[0]['count(*)'];
  countMap[DoctypeName.Supplier] = supplierCount[0]['count(*)'];

  return countMap;
}

export function getDeviceId(): UniqueId {
  let deviceId = config.get(ConfigKeys.DeviceId) as string | undefined;
  if (deviceId === undefined) {
    deviceId = getId();
    config.set(ConfigKeys.DeviceId, deviceId);
  }

  return deviceId;
}

export function getInstanceId(): UniqueId {
  const files = config.get(ConfigKeys.Files) as ConfigFile[];

  // @ts-ignore
  const companyName = frappe.AccountingSettings?.companyName;
  if (companyName === undefined) {
    return '';
  }

  const file = files.find((f) => f.companyName === companyName);

  if (file === undefined) {
    return addNewFile(companyName, files);
  }

  if (file.id === undefined) {
    return setInstanceId(companyName, files);
  }

  return file.id;
}

function addNewFile(companyName: string, files: ConfigFile[]): UniqueId {
  const newFile: ConfigFile = {
    companyName,
    filePath: config.get(ConfigKeys.LastSelectedFilePath, '') as string,
    id: getId(),
  };

  files.push(newFile);
  config.set(ConfigKeys.Files, files);
  return newFile.id;
}

function setInstanceId(companyName: string, files: ConfigFile[]): UniqueId {
  let id = '';
  for (const file of files) {
    if (file.id) {
      continue;
    }

    file.id = getId();
    if (file.companyName === companyName) {
      id = file.id;
    }
  }

  config.set(ConfigKeys.Files, files);
  return id;
}

export async function getCreds() {
  const creds = await ipcRenderer.invoke(IPC_ACTIONS.GET_CREDS);
  const url: string = creds?.telemetryUrl ?? '';
  const token: string = creds?.tokenString ?? '';
  return { url, token };
}

export const getTelemetryOptions = () => ({
  [TelemetrySetting.allow]: t`Allow Telemetry`,
  [TelemetrySetting.dontLogUsage]: t`Don't Log Usage`,
  [TelemetrySetting.dontLogAnything]: t`Don't Log Anything`,
});
