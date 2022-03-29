import { KnexColumnType } from './database/types';

export const sqliteTypeMap: Record<string, KnexColumnType> = {
  AutoComplete: 'text',
  Currency: 'text',
  Int: 'integer',
  Float: 'float',
  Percent: 'float',
  Check: 'boolean',
  Code: 'text',
  Date: 'date',
  Datetime: 'datetime',
  Time: 'time',
  Text: 'text',
  Data: 'text',
  Link: 'text',
  DynamicLink: 'text',
  Password: 'text',
  Select: 'text',
  File: 'binary',
  Attach: 'text',
  AttachImage: 'text',
  Color: 'text',
};

export const SYSTEM = '__SYSTEM__';
export const validTypes = Object.keys(sqliteTypeMap);
export function getDefaultMetaFieldValueMap() {
  const now = new Date().toISOString();
  return {
    createdBy: SYSTEM,
    modifiedBy: SYSTEM,
    created: now,
    modified: now,
  };
}
