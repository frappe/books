/**
 * CUSTOM — github.com/wemit/books
 *
 * Estonia addon — preload (renderer-side) IPC surface. Exposed on the global
 * `ipc.ee` namespace via main/addons/preload.ts. Only depends on ipcRenderer,
 * so it never pulls main-process (node) code into the preload bundle.
 */
import { ipcRenderer } from 'electron';
import type { BackendResponse } from 'utils/ipc/types';
import { EE_CHANNELS } from './ee.channels';

export const eePreload = {
  async detectArelle(arellePath: string): Promise<string | null> {
    return (await ipcRenderer.invoke(EE_CHANNELS.detectArelle, arellePath)) as
      | string
      | null;
  },

  async validateXbrl(options: {
    instancePath: string;
    taxonomyEntryPath?: string;
    arellePath: string;
  }): Promise<BackendResponse> {
    return (await ipcRenderer.invoke(
      EE_CHANNELS.validateXbrl,
      options
    )) as BackendResponse;
  },
};
