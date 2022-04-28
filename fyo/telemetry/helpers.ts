import { Fyo } from 'fyo';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import { DEFAULT_COUNTRY_CODE } from 'fyo/utils/consts';
import { t } from 'fyo/utils/translation';
import { Count, TelemetrySetting, UniqueId } from './types';

export function getId(): string {
  let id: string = '';

  for (let i = 0; i < 4; i++) {
    id += Math.random().toString(36).slice(2, 9);
  }

  return id;
}

export function getCountry(fyo: Fyo): string {
  return (
    (fyo.singles.SystemSettings?.countryCode as string) ?? DEFAULT_COUNTRY_CODE
  );
}

export function getLanguage(fyo: Fyo): string {
  return fyo.config.get('language') as string;
}

export async function getCounts(
  interestingDocs: string[],
  fyo: Fyo
): Promise<Count> {
  const countMap: Count = {};
  if (fyo.db === undefined) {
    return countMap;
  }

  for (const name of interestingDocs) {
    const count: number = (await fyo.db.getAll(name)).length;
    countMap[name] = count;
  }

  return countMap;
}

export function getDeviceId(fyo: Fyo): UniqueId {
  let deviceId = fyo.config.get(ConfigKeys.DeviceId) as string | undefined;
  if (deviceId === undefined) {
    deviceId = getId();
    fyo.config.set(ConfigKeys.DeviceId, deviceId);
  }

  return deviceId;
}

export function getInstanceId(fyo: Fyo): UniqueId {
  const files = (fyo.config.get(ConfigKeys.Files) ?? []) as ConfigFile[];

  const companyName = fyo.singles.AccountingSettings?.companyName as string;
  if (companyName === undefined) {
    return '';
  }

  const file = files.find((f) => f.companyName === companyName);

  if (file === undefined) {
    return addNewFile(companyName, files, fyo);
  }

  if (file.id === undefined) {
    return setInstanceId(companyName, files, fyo);
  }

  return file.id;
}

function addNewFile(
  companyName: string,
  files: ConfigFile[],
  fyo: Fyo
): UniqueId {
  const newFile: ConfigFile = {
    companyName,
    dbPath: fyo.config.get(ConfigKeys.LastSelectedFilePath, '') as string,
    id: getId(),
  };

  files.push(newFile);
  fyo.config.set(ConfigKeys.Files, files);
  return newFile.id;
}

function setInstanceId(
  companyName: string,
  files: ConfigFile[],
  fyo: Fyo
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

  fyo.config.set(ConfigKeys.Files, files);
  return id;
}

export const getTelemetryOptions = () => ({
  [TelemetrySetting.allow]: t`Allow Telemetry`,
  [TelemetrySetting.dontLogUsage]: t`Don't Log Usage`,
  [TelemetrySetting.dontLogAnything]: t`Don't Log Anything`,
});
