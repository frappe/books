import { FieldTypeEnum } from "schemas/types";

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
export type SettingsTab = 'Invoice' | 'General' | 'System';

export interface QuickEditOptions {
  schemaName: string;
  name: string;
  hideFields?: string[];
  showFields?: string[];
  defaults?: Record<string, unknown>;
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
  fieldtype: FieldTypeEnum;
  label: string;
  export: boolean;
}

export interface ExportTableField {
  fieldname: string;
  label: string;
  target: string;
  fields: ExportField[];
}

export type ExportFormat = 'csv' | 'json';