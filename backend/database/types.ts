import { Field, RawValue } from '../../schemas/types';
import { DatabaseManager } from './manager';

export type QueryFilter = Record<string, string | string[]>;

export interface GetQueryBuilderOptions {
  offset?: number;
  limit?: number;
  groupBy?: string;
  orderBy?: string;
  order?: 'desc' | 'asc';
}

export interface GetAllOptions {
  schemaName: string;
  fields?: string[];
  filters?: QueryFilter;
  start?: number;
  limit?: number;
  groupBy?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
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
