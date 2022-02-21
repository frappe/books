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
}
