import { Fyo } from 'fyo';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import { DEFAULT_COUNTRY_CODE } from 'fyo/utils/consts';
import { ModelNameEnum } from 'models/types';
import { getRandomString } from 'utils';
import { UniqueId } from './types';

export function getCountry(fyo: Fyo): string {
  return (
    (fyo.singles.SystemSettings?.countryCode as string) ?? DEFAULT_COUNTRY_CODE
  );
}

export function getLanguage(fyo: Fyo): string {
  return fyo.config.get('language') as string;
}

export function getDeviceId(fyo: Fyo): UniqueId {
  let deviceId = fyo.config.get(ConfigKeys.DeviceId) as string | undefined;
  if (deviceId === undefined) {
    deviceId = getRandomString();
    fyo.config.set(ConfigKeys.DeviceId, deviceId);
  }

  return deviceId;
}

export async function getInstanceId(fyo: Fyo): Promise<UniqueId> {
  const instanceId = (await fyo.getValue(
    ModelNameEnum.SystemSettings,
    'instanceId'
  )) as string;
  const companyName = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'companyName'
  )) as string;
  const dbPath = fyo.db.dbPath!;
  const files = (fyo.config.get(ConfigKeys.Files) ?? []) as ConfigFile[];

  let file = files.find((f) => f.id === instanceId);

  if (file === undefined) {
    file = addNewConfigFile(companyName, dbPath, instanceId, files, fyo);
  }

  if (!file.id) {
    setIdOnConfigFile(instanceId, companyName, dbPath, files, fyo);
  }

  return instanceId;
}

export function addNewConfigFile(
  companyName: string,
  dbPath: string,
  instanceId: string,
  files: ConfigFile[],
  fyo: Fyo
): ConfigFile {
  const newFile: ConfigFile = {
    companyName,
    dbPath,
    id: instanceId,
    openCount: 0,
  };

  files.push(newFile);
  fyo.config.set(ConfigKeys.Files, files);
  return newFile;
}

export async function getVersion(fyo: Fyo) {
  const version = (await fyo.getValue(
    ModelNameEnum.SystemSettings,
    'version'
  )) as string | undefined;

  if (version) {
    return version;
  }

  return fyo.store.appVersion;
}

function setIdOnConfigFile(
  instanceId: string,
  companyName: string,
  dbPath: string,
  files: ConfigFile[],
  fyo: Fyo
) {
  for (const file of files) {
    if (file.companyName !== companyName || file.dbPath !== dbPath) {
      continue;
    }

    file.id = instanceId;
  }

  fyo.config.set(ConfigKeys.Files, files);
}
