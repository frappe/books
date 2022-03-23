import Document from '../frappe/model/document';
import Meta from '../frappe/model/meta';
import { Model } from '../src/types/model';

export function getModels(): Record<string, Model> {
  // TODO: complete this function
  return {};
}

export function getMeta(doctype: string): Meta {
  // TODO: compete this function
  return new Meta();
}

export function getNewDoc(data: Record<string, unknown>): Document {
  // TODO: compete this function
  return new Document();
}

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
