// ipcRenderer.send(...)
export enum IPC_MESSAGES {
  OPEN_MENU = 'open-menu',
  OPEN_SETTINGS = 'open-settings',
  OPEN_EXTERNAL = 'open-external',
  SHOW_ITEM_IN_FOLDER = 'show-item-in-folder',
  RELOAD_MAIN_WINDOW = 'reload-main-window',
  MINIMIZE_MAIN_WINDOW = 'minimize-main-window',
  MAXIMIZE_MAIN_WINDOW = 'maximize-main-window',
  ISMAXIMIZED_MAIN_WINDOW = 'ismaximized-main-window',
  ISMAXIMIZED_RESULT = 'ismaximized-result',
  ISFULLSCREEN_MAIN_WINDOW = 'isfullscreen-main-window',
  ISFULLSCREEN_RESULT = 'isfullscreen-result',
  CLOSE_MAIN_WINDOW = 'close-main-window',
  UPDATE_AVAILABLE = 'update-available',
  UPDATE_DOWNLOADED = 'update-downloaded',
}

// ipcRenderer.invoke(...)
export enum IPC_ACTIONS {
  GET_OPEN_FILEPATH = 'open-dialog',
  GET_SAVE_FILEPATH = 'save-dialog',
  GET_DIALOG_RESPONSE = 'show-message-box',
  GET_ENV = 'get-env',
  SAVE_HTML_AS_PDF = 'save-html-as-pdf',
  PRINT_HTML_DOCUMENT = 'print-html-document',
  SAVE_DATA = 'save-data',
  SHOW_ERROR = 'show-error',
  SEND_ERROR = 'send-error',
  GET_LANGUAGE_MAP = 'get-language-map',
  CHECK_FOR_UPDATES = 'check-for-updates',
  DOWNLOAD_UPDATE = 'download-update',
  DOWNLOAD_UPDATE_MANUAL = 'download-update-manual',
  CHECK_DB_ACCESS = 'check-db-access',
  SELECT_FILE = 'select-file',
  GET_CREDS = 'get-creds',
  GET_DB_LIST = 'get-db-list',
  GET_TEMPLATES = 'get-templates',
  INIT_SHEDULER = 'init-scheduler',
  DELETE_FILE = 'delete-file',
  GET_DB_DEFAULT_PATH = 'get-db-default-path',
  SEND_API_REQUEST = 'send-api-request',
  // Database messages
  DB_CREATE = 'db-create',
  DB_CONNECT = 'db-connect',
  DB_CALL = 'db-call',
  DB_BESPOKE = 'db-bespoke',
  DB_SCHEMA = 'db-schema',
}

// ipcMain.send(...)
export enum IPC_CHANNELS {
  TRIGGER_ERPNEXT_SYNC = 'trigger-erpnext-sync',
  LOG_MAIN_PROCESS_ERROR = 'main-process-error',
  CONSOLE_LOG = 'console-log',
}

export enum DB_CONN_FAILURE {
  INVALID_FILE = 'invalid-file',
  CANT_OPEN = 'cant-open',
  CANT_CONNECT = 'cant-connect',
}

// events
export enum CUSTOM_EVENTS {
  MAIN_PROCESS_ERROR = 'main-process-error',
  LOG_UNEXPECTED = 'log-unexpected',
}
