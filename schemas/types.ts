/**
 * # Schema
 *
 * Main purpose of this is to describe the shape of the Models table in the
 * database. But there is some irrelevant information in the schemas with
 * respect to this goal. This is information is allowed as long as it is not
 * dynamic, which is impossible anyways as the files are data (.json !.js)
 *
 * If any field has to have a dynamic value, it should be added to the controller
 * file by the same name.
 *
 * There are a few types of schemas:
 * - _Regional_: Schemas that are in the '../regional' subdirectories
 *      these can be of any of the below types.
 * - _Abstract_: Schemas that are not used as they are but only after they are
 *      extended by Stub schemas. Indentified by the `isAbstract` field
 * - _Subclass_: Schemas that have an "extends" field on them, the value of which
 *      points to an Abstract schema.
 * - _Complete_: Schemas which are neither abstract nor stub.
 *
 *
 * ## Final Schema
 *
 * This is the schema which is used by the database and app code.
 *
 * The order in which a schema is built is:
 * 1. Build _Regional_ schemas by overriding the fields and other properties of the
 *      non regional variants.
 * 2. Combine _Subclass_ schemas with _Abstract_ schemas to get complete schemas.
 *
 * Note: if a Regional schema is not present as a non regional variant it's used
 * as it is.
 * 
 * ## Additional Notes
 * 
 * In all the schemas, the 'name' field/column is the primary key. If it isn't
 * explicitly added, the schema builder will add it in.
 */

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
export type RawValue = string | number | boolean | null;

// prettier-ignore
export interface BaseField {
  fieldname: string;             // Column name in the db
  fieldtype: FieldType;          // UI Descriptive field types that map to column types
  label: string;                 // Translateable UI facing name
  required?: boolean;            // Implies Not Null
  hidden?: boolean;              // UI Facing config, whether field is shown in a form
  readOnly?: boolean;            // UI Facing config, whether field is editable
  description?: string;          // UI Facing, translateable, used for inline documentation
  default?: RawValue;            // Default value of a field, should match the db type
  placeholder?: string;          // UI Facing config, form field placeholder
  groupBy?: string;              // UI Facing used in dropdowns fields
  computed?: boolean;            // Indicates whether a value is computed, implies readonly
  meta?: boolean;                // Field is a meta field, i.e. only for the db, not UI
}

export type SelectOption = { value: string; label: string };
export interface OptionField extends BaseField {
  fieldtype:
    | FieldTypeEnum.Select
    | FieldTypeEnum.AutoComplete
    | FieldTypeEnum.Color;
  options: SelectOption[];
}

// prettier-ignore
export interface TargetField extends BaseField {
  fieldtype: FieldTypeEnum.Table | FieldTypeEnum.Link;
  target: string;                // Name of the table or group of tables to fetch values
}

// @formatter:off
export interface DynamicLinkField extends BaseField {
  fieldtype: FieldTypeEnum.DynamicLink;
  references: string;            // Reference to an option field that links to schema
}

// @formatter:off
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

export type TreeSettings = { parentField: string };

// @formatter:off
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
  treeSettings?: TreeSettings;   // Used to determine root nodes
}

export interface SchemaStub extends Partial<Schema> {
  name: string;
}
export type SchemaMap = Record<string, Schema>;
export type SchemaStubMap = Record<string, SchemaStub>;
