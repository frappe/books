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

export const telemetryOptions = {
  allow: frappe.t`Allow Telemetry`,
  dontLogUsage: frappe.t`Don't Log Usage`,
  dontLogAnything: frappe.t`Don't Log Anything`,
};

export interface ConfigFile {
  id: string;
  companyName: string;
  filePath: string;
}
