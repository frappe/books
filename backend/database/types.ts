import { Field, RawValue } from '../../schemas/types';

export type QueryFilter = Record<string, string | string[]>;

export interface GetQueryBuilderOptions {
  offset: number;
  limit: number;
  groupBy: string;
  orderBy: string;
  order: 'desc' | 'asc';
}

export interface GetAllOptions {
  schemaName?: string;
  fields?: string[];
  filters?: Record<string, string>;
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
    execute: (DatabaseManager) => Promise<void>;
    beforeMigrate?: boolean;
  };
}
