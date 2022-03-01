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
}

export interface Doc {
  name: string;
  set: (fieldname: Map | string, value?: unknown) => Promise<void>;
  insert: () => Promise<void>;
  submit: () => Promise<void>;
}
