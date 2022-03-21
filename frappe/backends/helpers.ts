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
