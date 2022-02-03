// ipcRenderer.send(...)
export const IPC_MESSAGES = {
  OPEN_MENU: 'open-menu',
  OPEN_SETTINGS: 'open-settings',
  OPEN_EXTERNAL: 'open-external',
  SHOW_ITEM_IN_FOLDER: 'show-item-in-folder',
  RELOAD_MAIN_WINDOW: 'reload-main-window',
  RESIZE_MAIN_WINDOW: 'resize-main-window',
  CLOSE_CURRENT_WINDOW: 'close-current-window',
  MINIMIZE_CURRENT_WINDOW: 'minimize-current-window',
  DOWNLOAD_UPDATE: 'download-update',
  INSTALL_UPDATE: 'install-update',
};

// ipcRenderer.invoke(...)
export const IPC_ACTIONS = {
  TOGGLE_MAXIMIZE_CURRENT_WINDOW: 'toggle-maximize-current-window',
  GET_OPEN_FILEPATH: 'open-dialog',
  GET_SAVE_FILEPATH: 'save-dialog',
  GET_DIALOG_RESPONSE: 'show-message-box',
  GET_PRIMARY_DISPLAY_SIZE: 'get-primary-display-size',
  SAVE_HTML_AS_PDF: 'save-html-as-pdf',
  SAVE_DATA: 'save-data',
  SHOW_ERROR: 'show-error',
  SEND_ERROR: 'send-error',
  CHECK_FOR_UPDATES: 'check-for-updates',
};

// ipcMain.send(...)
export const IPC_CHANNELS = {
  STORE_ON_WINDOW: 'store-on-window',
  CHECKING_FOR_UPDATE: 'checking-for-update',
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_NOT_AVAILABLE: 'update-not-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_ERROR: 'update-error',
};

export const DB_CONN_FAILURE = {
  INVALID_FILE: 'invalid-file',
  CANT_OPEN: 'cant-open',
  CANT_CONNECT: 'cant-connect',
};
