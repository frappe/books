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
}

export enum TelemetrySetting {
  allow = 'allow',
  dontLogUsage = 'dontLogUsage',
  dontLogAnything = 'dontLogAnything',
}

export const telemetryOptions = {
  [TelemetrySetting.allow]: frappe.t`Allow Telemetry`,
  [TelemetrySetting.dontLogUsage]: frappe.t`Don't Log Usage`,
  [TelemetrySetting.dontLogAnything]: frappe.t`Don't Log Anything`,
};

export interface ConfigFile {
  id: string;
  companyName: string;
  filePath: string;
}
