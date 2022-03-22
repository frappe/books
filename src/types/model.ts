export type Map = {
  [key: string]: unknown;
};

export enum FieldType {
  Data = 'Data',
  Select = 'Select',
  Link = 'Link',
  Date = 'Date',
  Table = 'Table',
  AutoComplete = 'AutoComplete',
  Check = 'Check',
  AttachImage = 'AttachImage',
  DynamicLink = 'DynamicLink',
  Int = 'Int',
  Float = 'Float',
  Currency = 'Currency',
  Text = 'Text',
  Color = 'Color',
}

export interface Field {
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  childtype?: string;
  target?: string;
  default?: unknown;
  required?: number;
  readOnly?: number;
  hidden?: number | Function;
  options?: string[];
  description?: string;
}

export interface Doc {
  name: string;
  set: (fieldname: Map | string, value?: unknown) => Promise<void>;
  insert: () => Promise<void>;
  submit: () => Promise<void>;
}

export interface Model {
  label?: string;
  name: string;
  doctype?: string;
  fields: Field[];
  isSingle?: number; // boolean
  regional?: number; // boolean
  augmented?: number; // boolean
  keywordFields?: string[];
  quickEditFields?: string[];
}