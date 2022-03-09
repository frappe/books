import Store from 'electron-store';

const config = new Store();
export default config;

export enum ConfigKeys {
  Files = 'files',
  LastSelectedFilePath = 'lastSelectedFilePath',
  Language = 'language',
  DeviceId = 'deviceId',
}

export interface ConfigFile {
  id: string;
  companyName: string;
  filePath: string;
}
