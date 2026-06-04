/**
 * CUSTOM — github.com/wemit/books
 *
 * Registers every main-process addon's IPC handlers. Called once from
 * main/registerIpcMainActionListeners.ts. Add an addon = register it here;
 * the core listener file is never touched again.
 */
import { registerEeHandlers } from './ee.handlers';

export function registerMainAddonHandlers() {
  registerEeHandlers();
}
