import type { Doc } from 'fyo/model/doc';
import type { Action } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import type { Field, FieldType } from 'schemas/types';
import type { QueryFilter } from 'utils/db/types';

export interface MessageDialogButton {
  label: string;
  action: () => Promise<unknown> | unknown;
}

export interface MessageDialogOptions {
  message: string;
  detail?: string;
  buttons?: MessageDialogButton[];
}

export interface ToastOptions {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  action?: () => void;
  actionText?: string;
}

export type WindowAction = 'close' | 'minimize' | 'maximize' | 'unmaximize';
export type SettingsTab =
  | ModelNameEnum.AccountingSettings
  | ModelNameEnum.Defaults
  | ModelNameEnum.PrintSettings
  | ModelNameEnum.SystemSettings;

export interface QuickEditOptions {
  doc?: Doc;
  schemaName?: string;
  name?: string;
  hideFields?: string[];
  showFields?: string[];
  defaults?: Record<string, unknown>;
  listFilters?: QueryFilter;
}

export type SidebarConfig = SidebarRoot[];
export interface SidebarRoot {
  label: string;
  name: string;
  route: string;
  icon: string;
  iconSize?: string;
  iconHeight?: string;
  hidden?: () => boolean;
  items?: SidebarItem[];
  filters?: QueryFilter;
}

export interface SidebarItem {
  label: string;
  name: string;
  route: string;
  schemaName?: string;
  hidden?: () => boolean;
}

export interface ExportField {
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  export: boolean;
}

export interface ExportTableField {
  fieldname: string;
  label: string;
  target: string;
  fields: ExportField[];
}

export type ActionGroup = {
  group: string;
  label: string;
  type: string;
  actions: Action[];
};

export type UIGroupedFields = Map<string, Map<string, Field[]>>;
export type ExportFormat = 'csv' | 'json';
export type PeriodKey = 'This Year' | 'This Quarter' | 'This Month';

export type PrintValues = {
  print: Record<string, unknown>;
  doc: Record<string, unknown>;
};
