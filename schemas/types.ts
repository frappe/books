import { PropertyEnum } from "utils/types";

export type FieldType =
  | 'Data'
  | 'Select'
  | 'Link'
  | 'Date'
  | 'Datetime'
  | 'Table'
  | 'AutoComplete'
  | 'Check'
  | 'AttachImage'
  | 'DynamicLink'
  | 'Int'
  | 'Float'
  | 'Currency'
  | 'Text'
  | 'Color'
  | 'Button'
  | 'Attachment';

export const FieldTypeEnum: PropertyEnum<Record<FieldType, FieldType>> = {
  Data: 'Data',
  Select: 'Select',
  Link: 'Link',
  Date: 'Date',
  Datetime: 'Datetime',
  Table: 'Table',
  AutoComplete: 'AutoComplete',
  Check: 'Check',
  AttachImage: 'AttachImage',
  DynamicLink: 'DynamicLink',
  Int: 'Int',
  Float: 'Float',
  Currency: 'Currency',
  Text: 'Text',
  Color: 'Color',
  Button: 'Button',
  Attachment: 'Attachment',
};

type OptionFieldType = 'Select' | 'AutoComplete' | 'Color';
type TargetFieldType = 'Table' | 'Link';
type NumberFieldType = 'Int' | 'Float';
type DynamicLinkFieldType = 'DynamicLink';
type BaseFieldType = Exclude<
  FieldType,
  TargetFieldType | DynamicLinkFieldType | OptionFieldType | NumberFieldType
>;

export type RawValue = string | number | boolean | null;

export interface BaseField {
  fieldname: string;             // Column name in the db
  fieldtype: BaseFieldType;      // UI Descriptive field types that map to column types
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
  filter?: boolean;              // UI Facing config, whether to be used to filter the List.
  computed?: boolean;            // Computed values are not stored in the database.
  section?: string;              // UI Facing config, for grouping by sections
  tab?: string;                  // UI Facing config, for grouping by tabs
  abstract?: string;             // Used to mark the location of a field in an Abstract schema 
  isCustom?: boolean;            // Whether the field is a custom field
  filters?: Record<string, string>;
  getOptions?: () => Promise<{ label: string; value: string }[]>; 
}

export type SelectOption = { value: string; label: string };
export interface OptionField extends Omit<BaseField, 'fieldtype'> {
  fieldtype: OptionFieldType;
  options: SelectOption[];
  allowCustom?: boolean;
}

export interface TargetField extends Omit<BaseField, 'fieldtype'> {
  fieldtype: TargetFieldType;
  target: string;                // Name of the table or group of tables to fetch values
  create?: boolean;              // Whether to show Create in the dropdown
  edit?: boolean;                // Whether the Table has quick editable columns
}

export interface DynamicLinkField extends Omit<BaseField, 'fieldtype'> {
  fieldtype: DynamicLinkFieldType;
  references: string;            // Reference to an option field that links to schema
}

export interface NumberField extends Omit<BaseField, 'fieldtype'> {
  fieldtype: NumberFieldType;
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
  linkDisplayField?:string;      // Display field if inline editable
  create?: boolean               // Whether the user can create an entry from the ListView
  naming?: Naming;               // Used for assigning name, default is 'random' else 'numberSeries' if present
  titleField?: string;           // Main display field
  removeFields?: string[];       // Used by the builder to remove fields.
}

export interface SchemaStub extends Partial<Schema> {
  name: string;
}
export type SchemaMap = Record<string, Schema | undefined>;
export type SchemaStubMap = Record<string, SchemaStub>;
