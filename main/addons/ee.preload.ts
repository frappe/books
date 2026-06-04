/**
 * CUSTOM — github.com/wemit/books
 *
 * Estonia addon — preload (renderer-side) IPC surface. Exposed on the global
 * `ipc.ee` namespace via main/addons/preload.ts. Only depends on ipcRenderer,
 * so it never pulls main-process (node) code into the preload bundle.
 */
import { ipcRenderer } from 'electron';
import type { BackendResponse } from 'utils/ipc/types';
// Type-only import: erased at compile, never pulls node-bound arelleValidator
// code into the preload bundle. Keeps the IPC contract single-sourced.
import type { ValidateOptions } from '../arelleValidator';
import { EE_CHANNELS } from './ee.channels';

export const eePreload = {
  async detectArelle(arellePath: string): Promise<string | null> {
    return (await ipcRenderer.invoke(EE_CHANNELS.detectArelle, arellePath)) as
      | string
      | null;
  },

  async validateXbrl(options: ValidateOptions): Promise<BackendResponse> {
    return (await ipcRenderer.invoke(
      EE_CHANNELS.validateXbrl,
      options
    )) as BackendResponse;
  },
};
