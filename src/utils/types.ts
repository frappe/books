export interface MessageDialogButton {
  label: string;
  action: () => void;
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
