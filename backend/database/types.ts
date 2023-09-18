import type { Field, FieldType, RawValue } from '../../schemas/types';
import type DatabaseCore from './core';
import type { DatabaseManager } from './manager';

export interface GetQueryBuilderOptions {
  offset?: number;
  limit?: number;
  groupBy?: string | string[];
  orderBy?: string | string[];
  order?: 'desc' | 'asc';
}

export type ColumnDiff = { added: Field[]; removed: string[] };
export type FieldValueMap = Record<
  string,
  RawValue | undefined | FieldValueMap[]
>;

export type AlterConfig = {
  schemaName: string;
  diff: ColumnDiff;
  newForeignKeys: Field[];
};

export type NonExtantConfig = {
  schemaName: string;
  nonExtant: {
    fieldname: string;
    value: RawValue;
  }[];
};

export type UpdateSinglesConfig = {
  update: string[];
  updateNonExtant: NonExtantConfig[];
};

export type MigrationConfig = {
  pre?: () => Promise<void> | void;
  post?: () => Promise<void> | void;
};

export interface Patch {
  name: string;
  version: string;
  patch: {
    execute: (dm: DatabaseManager) => Promise<void>;
    beforeMigrate?: boolean;
  };
  priority?: number;
}

export type KnexColumnType =
  | 'text'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'binary';

// Returned by pragma table_info
export interface SqliteTableInfo {
  pk: number;
  cid: number;
  name: string;
  type: string;
  notnull: number; // 0 | 1
  dflt_value: string | null;
}

export type BespokeFunction = (
  db: DatabaseCore,
  ...args: unknown[]
) => Promise<unknown>;

export type SingleValue<T> = {
  fieldname: string;
  parent: string;
  value: T;
}[];

export type RawCustomField = {
  parent: string;
  label: string;
  fieldname: string;
  fieldtype: FieldType;
  isRequired?: boolean;
  section?: string;
  tab?: string;
  options?: string;
  target?: string;
  references?: string;
  default?: string;
};
