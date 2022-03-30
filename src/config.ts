import Store from 'electron-store';
import frappe from 'frappe';

const config = new Store();
export default config;

export enum ConfigKeys {
  Files = 'files',
  LastSelectedFilePath = 'lastSelectedFilePath',
  Language = 'language',
  DeviceId = 'deviceId',
  Telemetry = 'telemetry',
  OpenCount = 'openCount',
}

export enum TelemetrySetting {
  allow = 'allow',
  dontLogUsage = 'dontLogUsage',
  dontLogAnything = 'dontLogAnything',
}

export interface ConfigFile {
  id: string;
  companyName: string;
  filePath: string;
}
