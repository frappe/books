import { Frappe } from 'frappe';
import { ConfigFile, ConfigKeys } from 'frappe/core/types';
import { DEFAULT_COUNTRY_CODE } from 'frappe/utils/consts';
import { Count, TelemetrySetting, UniqueId } from './types';

export function getId(): string {
  let id: string = '';

  for (let i = 0; i < 4; i++) {
    id += Math.random().toString(36).slice(2, 9);
  }

  return id;
}

export function getCountry(): string {
  // @ts-ignore
  return frappe.singles.SystemSettings?.countryCode ?? DEFAULT_COUNTRY_CODE;
}

export function getLanguage(frappe: Frappe): string {
  return frappe.config.get('language') as string;
}

export async function getCounts(
  interestingDocs: string[],
  frappe: Frappe
): Promise<Count> {
  const countMap: Count = {};
  // @ts-ignore
  if (frappe.db === undefined) {
    return countMap;
  }

  for (const name of interestingDocs) {
    const count: number = (await frappe.db.getAll(name)).length;
    countMap[name] = count;
  }

  return countMap;
}

export function getDeviceId(frappe: Frappe): UniqueId {
  let deviceId = frappe.config.get(ConfigKeys.DeviceId) as string | undefined;
  if (deviceId === undefined) {
    deviceId = getId();
    frappe.config.set(ConfigKeys.DeviceId, deviceId);
  }

  return deviceId;
}

export function getInstanceId(frappe: Frappe): UniqueId {
  const files = frappe.config.get(ConfigKeys.Files) as ConfigFile[];

  // @ts-ignore
  const companyName = frappe.AccountingSettings?.companyName;
  if (companyName === undefined) {
    return '';
  }

  const file = files.find((f) => f.companyName === companyName);

  if (file === undefined) {
    return addNewFile(companyName, files, frappe);
  }

  if (file.id === undefined) {
    return setInstanceId(companyName, files, frappe);
  }

  return file.id;
}

function addNewFile(
  companyName: string,
  files: ConfigFile[],
  frappe: Frappe
): UniqueId {
  const newFile: ConfigFile = {
    companyName,
    filePath: frappe.config.get(ConfigKeys.LastSelectedFilePath, '') as string,
    id: getId(),
  };

  files.push(newFile);
  frappe.config.set(ConfigKeys.Files, files);
  return newFile.id;
}

function setInstanceId(
  companyName: string,
  files: ConfigFile[],
  frappe: Frappe
): UniqueId {
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

  frappe.config.set(ConfigKeys.Files, files);
  return id;
}

export const getTelemetryOptions = (frappe: Frappe) => ({
  [TelemetrySetting.allow]: frappe.t`Allow Telemetry`,
  [TelemetrySetting.dontLogUsage]: frappe.t`Don't Log Usage`,
  [TelemetrySetting.dontLogAnything]: frappe.t`Don't Log Anything`,
});
