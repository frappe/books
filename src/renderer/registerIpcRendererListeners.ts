import { ipcRenderer } from 'electron';
import { handleError } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { IPC_CHANNELS } from 'utils/messages';

export default function registerIpcRendererListeners() {
  ipcRenderer.on(
    IPC_CHANNELS.LOG_MAIN_PROCESS_ERROR,
    async (_, error, more) => {
      if (!(error instanceof Error)) {
        throw error;
      }

      if (!more) {
        more = {};
      }

      if (typeof more !== 'object') {
        more = { more };
      }

      more.isMainProcess = true;
      more.notifyUser ??= true;

      await handleError(true, error, more, more.notifyUser);
    }
  );

  ipcRenderer.on(IPC_CHANNELS.CONSOLE_LOG, (_, ...stuff: unknown[]) => {
    if (!fyo.store.isDevelopment) {
      return;
    }

    if (fyo.store.isDevelopment) {
      console.log(...stuff);
    }
  });

  document.addEventListener('visibilitychange', function () {
    const { visibilityState } = document;
    if (visibilityState === 'visible' && !fyo.telemetry.started) {
      fyo.telemetry.start();
    }

    if (visibilityState !== 'hidden') {
      return;
    }

    fyo.telemetry.stop();
  });
}
