import { Doc } from 'fyo/model/doc';
import Money from 'pesa/dist/types/src/money';
import { RawValue } from 'schemas/types';
import { AuthDemuxBase } from 'utils/auth/types';
import { DatabaseDemuxBase } from 'utils/db/types';

export type DocValue =
  | string
  | number
  | boolean
  | Date
  | Money
  | null
  | undefined;
export type DocValueMap = Record<string, DocValue | Doc[] | DocValueMap[]>;
export type RawValueMap = Record<string, RawValue | RawValueMap[]>;

/**
 * DatabaseDemuxConstructor: type for a constructor that returns a DatabaseDemuxBase
 * it's typed this way because `typeof AbstractClass` is invalid as abstract classes
 * can't be initialized using `new`.
 *
 * AuthDemuxConstructor: same as the above but for AuthDemuxBase
 */

export type DatabaseDemuxConstructor = new (
  isElectron?: boolean
) => DatabaseDemuxBase;

export type AuthDemuxConstructor = new (isElectron?: boolean) => AuthDemuxBase;

export enum ConfigKeys {
  Files = 'files',
  LastSelectedFilePath = 'lastSelectedFilePath',
  Language = 'language',
  DeviceId = 'deviceId',
  Telemetry = 'telemetry',
  OpenCount = 'openCount',
}

export interface ConfigFile {
  id: string;
  companyName: string;
  dbPath: string;
}

export interface FyoConfig {
  DatabaseDemux?: DatabaseDemuxConstructor;
  AuthDemux?: AuthDemuxConstructor;
  isElectron?: boolean;
  isTest?: boolean;
}
