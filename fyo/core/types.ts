import type { Doc } from 'fyo/model/doc';
import type { Money } from 'pesa';
import type { RawValue } from 'schemas/types';
import type { AuthDemuxBase } from 'utils/auth/types';
import type { DatabaseDemuxBase } from 'utils/db/types';

export type Attachment = { name: string; type: string; data: string };
export type DocValue =
  | string
  | number
  | boolean
  | Date
  | Money
  | null
  | Attachment
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

export type ConfigMap = {
  files: ConfigFile[];
  lastSelectedFilePath: null | string;
  language: string 
  deviceId: string
  darkMode: boolean
};

export interface ConfigFile {
  id: string;
  companyName: string;
  dbPath: string;
  openCount: number;
}

export interface FyoConfig {
  DatabaseDemux?: DatabaseDemuxConstructor;
  AuthDemux?: AuthDemuxConstructor;
  isElectron?: boolean;
  isTest?: boolean;
}
