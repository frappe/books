export enum FieldTypeEnum {
  Data = 'Data',
  Select = 'Select',
  Link = 'Link',
  Date = 'Date',
  Datetime = 'Datetime',
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

export type FieldType = keyof typeof FieldTypeEnum;
export type RawValue = string | number | boolean | null;

export interface BaseField {
  fieldname: string;             // Column name in the db
  fieldtype: FieldType;          // UI Descriptive field types that map to column types
  label: string;                 // Translateable UI facing name
  schemaName?: string;           // Convenient access to schemaName incase just the field is passed
  required?: boolean;            // Implies Not Null
  hidden?: boolean;              // UI Facing config, whether field is shown in a form
  readOnly?: boolean;            // UI Facing config, whether field is editable
  description?: string;          // UI Facing, translateable, used for inline documentation
  default?: RawValue;            // Default value of a field, should match the db type
  placeholder?: string;          // UI Facing config, form field placeholder
  groupBy?: string;              // UI Facing used in dropdowns fields
  meta?: boolean;                // Field is a meta field, i.e. only for the db, not UI
  inline?: boolean;              // UI Facing config, whether to display doc inline.
  filter?: boolean;               // UI Facing config, whether to be used to filter the List.
  computed?: boolean;            // Computed values are not stored in the database.
}

export type SelectOption = { value: string; label: string };
export interface OptionField extends BaseField {
  fieldtype:
    | FieldTypeEnum.Select
    | FieldTypeEnum.AutoComplete
    | FieldTypeEnum.Color;
  options: SelectOption[];
  emptyMessage?: string;
  allowCustom?: boolean;
}

export interface TargetField extends BaseField {
  fieldtype: FieldTypeEnum.Table | FieldTypeEnum.Link;
  target: string;                // Name of the table or group of tables to fetch values
  create?: boolean;              // Whether to show Create in the dropdown
  edit?: boolean;                // Whether the Table has quick editable columns
}

export interface DynamicLinkField extends BaseField {
  fieldtype: FieldTypeEnum.DynamicLink;
  emptyMessage?: string;
  references: string;            // Reference to an option field that links to schema
}

export interface NumberField extends BaseField {
  fieldtype: FieldTypeEnum.Float | FieldTypeEnum.Int;
  minvalue?: number;             // UI Facing used to restrict lower bound
  maxvalue?: number;             // UI Facing used to restrict upper bound
}

export type Field =
  | BaseField
  | OptionField
  | TargetField
  | DynamicLinkField
  | NumberField;

export type Naming = 'autoincrement' | 'random' | 'numberSeries' | 'manual';

export interface Schema {
  name: string;                  // Table name
  label: string;                 // Translateable UI facing name
  fields: Field[];               // Maps to database columns
  isTree?: boolean;              // Used for nested set, eg for Chart of Accounts
  extends?: string;              // Value points to an Abstract schema. Indicates Subclass schema
  isChild?: boolean;             // Indicates a child table, i.e table with "parent" FK column
  isSingle?: boolean;            // Fields will be values in SingleValue, i.e. an Entity Attr. Value
  isAbstract?: boolean;          // Not entered into db, used to extend a Subclass schema
  tableFields?: string[]         // Used for displaying childTableFields
  isSubmittable?: boolean;       // For transactional types, values considered only after submit
  keywordFields?: string[];      // Used to get fields that are to be used for search.
  quickEditFields?: string[];    // Used to get fields for the quickEditForm
  inlineEditDisplayField?:string;// Display field if inline editable
  naming?: Naming;               // Used for assigning name, default is 'random' else 'numberSeries' if present
  titleField?: string;           // Main display field
  removeFields?: string[];       // Used by the builder to remove fields.
}

export interface SchemaStub extends Partial<Schema> {
  name: string;
}
export type SchemaMap = Record<string, Schema | undefined>;
export type SchemaStubMap = Record<string, SchemaStub>;
