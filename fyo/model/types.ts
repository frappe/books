import type { Fyo } from 'fyo';
import type { DocValue, DocValueMap } from 'fyo/core/types';
import type SystemSettings from 'fyo/models/SystemSettings';
import type { FieldType, Schema, SelectOption } from 'schemas/types';
import type { QueryFilter } from 'utils/db/types';
import type { RouteLocationRaw, Router } from 'vue-router';
import type { Doc } from './doc';
import type { AccountingSettings } from 'models/baseModels/AccountingSettings/AccountingSettings';
import type { Defaults } from 'models/baseModels/Defaults/Defaults';
import type { PrintSettings } from 'models/baseModels/PrintSettings/PrintSettings';
import type { InventorySettings } from 'models/inventory/InventorySettings';
import type { Misc } from 'models/baseModels/Misc';
import type { POSSettings } from 'models/inventory/Point of Sale/POSSettings';
import type { POSShift } from 'models/inventory/Point of Sale/POSShift';

/**
 * The functions below are used for dynamic evaluation
 * and setting of field types.
 *
 * Since they are set directly on the doc, they can
 * access the doc  by using `this`.
 *
 * - `Formula`: Async function used for obtaining a computed value such as amount (rate * qty).
 * - `Default`: Regular function used to dynamically set the default value, example new Date().
 * - `Validation`: Async function that throw an error if the value is invalid.
 * - `Required`: Regular function used to decide if a value is mandatory (there are !notnul in the db).
 */
export type FormulaReturn = DocValue | DocValueMap[] | undefined | Doc[];
export type Formula = (fieldname?: string) => Promise<FormulaReturn> | FormulaReturn;
export type FormulaConfig = { dependsOn?: string[]; formula: Formula };
export type Default = (doc: Doc) => DocValue;
export type Validation = (value: DocValue) => Promise<void> | void;
export type Required = () => boolean;
export type Hidden = () => boolean;
export type ReadOnly = () => boolean;
export type GetCurrency = () => string;

export type FormulaMap = Record<string, FormulaConfig | undefined>;
export type DefaultMap = Record<string, Default | undefined>;
export type ValidationMap = Record<string, Validation | undefined>;
export type RequiredMap = Record<string, Required | undefined>;
export type CurrenciesMap = Record<string, GetCurrency | undefined>;
export type HiddenMap = Record<string, Hidden | undefined>;
export type ReadOnlyMap = Record<string, ReadOnly | undefined>;

export type ChangeArg = { doc: Doc; changed: string };

/**
 * Should add this for hidden too
 */

export type ModelMap = Record<string, typeof Doc | undefined>;
export type DocMap = Record<string, Doc | undefined>;

export interface SinglesMap {
  SystemSettings?: SystemSettings;
  AccountingSettings?: AccountingSettings;
  InventorySettings?: InventorySettings;
  POSSettings?: POSSettings;
  POSShift?: POSShift;
  PrintSettings?: PrintSettings;
  Defaults?: Defaults;
  Misc?: Misc;
  [key: string]: Doc | undefined;
}

// Static Config properties

export type FilterFunction = (doc: Doc) => QueryFilter | Promise<QueryFilter>;
export type FiltersMap = Record<string, FilterFunction>;

export type EmptyMessageFunction = (doc: Doc) => string;
export type EmptyMessageMap = Record<string, EmptyMessageFunction>;

export type ListFunction = (doc?: Doc) => string[] | SelectOption[];
export type ListsMap = Record<string, ListFunction | undefined>;

export interface Action {
  label: string;
  action: (doc: Doc, router: Router) => Promise<void> | void | unknown;
  condition?: (doc: Doc) => boolean;
  group?: string;
  type?: 'primary' | 'secondary';
  component?: {
    template: string;
  };
}

export interface RenderData {
  schema: Schema,
  [key: string]: DocValue | Schema
}

export type ColumnConfig = {
  label: string;
  fieldtype: FieldType;
  fieldname: string;
  render?: (doc: RenderData) => { template: string };
  display?: (value: unknown, fyo: Fyo) => string;
}

export type ListViewColumn = string | ColumnConfig;
export interface ListViewSettings {
  formRoute?: (name: string) => RouteLocationRaw;
  columns?: ListViewColumn[];
}

export interface TreeViewSettings {
  parentField: string;
  getRootLabel: () => Promise<string>;
}

export type DocStatus =
  | ''
  | 'Draft'
  | 'Saved'
  | 'NotSaved'
  | 'Submitted'
  | 'Cancelled';
