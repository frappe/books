export enum FieldTypeEnum {
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
  Code = 'Code',
}

export type FieldType = keyof typeof FieldTypeEnum;
export type RawValue = string | number | boolean;

export interface BaseField {
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  hidden?: boolean;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  default?: RawValue;
  placeholder?: string;
  groupBy?: string;
  computed?: boolean;
}

export type SelectOption = { value: string; label: string };
export interface OptionField extends BaseField {
  fieldtype:
    | FieldTypeEnum.Select
    | FieldTypeEnum.AutoComplete
    | FieldTypeEnum.Color;
  options: SelectOption[];
}

export interface TargetField extends BaseField {
  fieldtype: FieldTypeEnum.Table | FieldTypeEnum.Link;
  target: string | string[];
}

export interface DynamicLinkField extends BaseField {
  fieldtype: FieldTypeEnum.DynamicLink;
  references: string;
}

export interface NumberField extends BaseField {
  fieldtype: FieldTypeEnum.Float | FieldTypeEnum.Int;
  minvalue?: number;
  maxvalue?: number;
}

export type Field =
  | BaseField
  | OptionField
  | TargetField
  | DynamicLinkField
  | NumberField;

export type TreeSettings = { parentField: string };
export interface Schema {
  name: string;
  label: string;
  fields: Field[];
  isTree?: boolean;
  extends?: string;
  isChild?: boolean;
  isSingle?: boolean;
  isAbstract?: boolean;
  isSubmittable?: boolean;
  keywordFields?: string[];
  treeSettings?: TreeSettings;
}
