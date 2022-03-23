export type RawType = string | number | boolean;
export type RawData = Record<string, RawType>[];
export type QueryFilter = Record<string, string | string[]>;

export interface GetQueryBuilderOptions {
  offset: number;
  limit: number;
  groupBy: string;
  orderBy: string;
  order: 'desc' | 'asc';
}
