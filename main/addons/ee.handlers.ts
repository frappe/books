/**
 * CUSTOM — github.com/wemit/books
 *
 * Estonia addon — main-process IPC handlers (Arelle XBRL validation). Imports
 * node-bound arelleValidator, so it stays out of the preload bundle.
 */
import { ipcMain } from 'electron';
import {
  ValidateOptions,
  detectArelle,
  validateXbrl,
} from '../arelleValidator';
import { getErrorHandledReponse } from '../helpers';
import { EE_CHANNELS } from './ee.channels';

export function registerEeHandlers() {
  ipcMain.handle(EE_CHANNELS.detectArelle, async (_, arellePath: string) => {
    return await detectArelle(arellePath);
  });

  ipcMain.handle(
    EE_CHANNELS.validateXbrl,
    async (_, options: ValidateOptions) => {
      return await getErrorHandledReponse(async () => {
        return await validateXbrl(options);
      });
    }
  );
}
