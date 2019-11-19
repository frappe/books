import { ipcRenderer } from 'electron';

export function openSettings(tab = 'General') {
  ipcRenderer.send('open-settings-window', tab);
}
