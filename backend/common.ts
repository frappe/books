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

export const validTypes = Object.keys(sqliteTypeMap);
export function getDefaultMetaFieldValueMap() {
  return {
    createdBy: '__SYSTEM__',
    modifiedBy: '__SYSTEM__',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };
}
