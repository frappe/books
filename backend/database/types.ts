import { Field, RawValue } from '../../schemas/types';
import DatabaseCore from './core';
import { DatabaseManager } from './manager';

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
