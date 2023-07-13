import { handleError } from 'src/errorHandling';
import { fyo } from 'src/initFyo';

export default function registerIpcRendererListeners() {
  ipc.registerMainProcessErrorListener(
    (_, error: unknown, more?: Record<string, unknown>) => {
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

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      handleError(true, error, more, !!more.notifyUser);
    }
  );

  ipc.registerConsoleLogListener((_, ...stuff: unknown[]) => {
    if (!fyo.store.isDevelopment) {
      return;
    }

    if (fyo.store.isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(...stuff);
    }
  });

  document.addEventListener('visibilitychange', () => {
    const { visibilityState } = document;
    if (visibilityState === 'visible' && !fyo.telemetry.started) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fyo.telemetry.start();
    }

    if (visibilityState !== 'hidden') {
      return;
    }

    fyo.telemetry.stop();
  });
}
