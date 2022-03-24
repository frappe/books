import { Field, FieldTypeEnum, SchemaMap } from '../schemas/types';

export const sqliteTypeMap = {
  AutoComplete: 'text',
  Currency: 'text',
  Int: 'integer',
  Float: 'float',
  Percent: 'float',
  Check: 'integer',
  Code: 'text',
  Date: 'text',
  Datetime: 'text',
  Time: 'text',
  Text: 'text',
  Data: 'text',
  Link: 'text',
  DynamicLink: 'text',
  Password: 'text',
  Select: 'text',
  File: 'text',
  Attach: 'text',
  AttachImage: 'text',
  Color: 'text',
};

export const validTypes = Object.keys(sqliteTypeMap);

export function getFieldsByType(
  schemaName: string,
  schemaMap: SchemaMap,
  type: FieldTypeEnum
): Field[] {
  const fields = schemaMap[schemaName].fields ?? [];
  return fields.filter((f) => f.fieldtype === type);
}
