import { ipcRenderer } from 'electron';
import { handleError } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/ui';
import { IPC_CHANNELS, IPC_MESSAGES } from 'utils/messages';

export default function registerIpcRendererListeners() {
  ipcRenderer.on(IPC_CHANNELS.CHECKING_FOR_UPDATE, (_) => {
    showToast({ message: fyo.t`Checking for updates` });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, (_, version) => {
    const message = version
      ? fyo.t`Version ${version} available`
      : fyo.t`New version available`;
    const action = () => {
      ipcRenderer.send(IPC_MESSAGES.DOWNLOAD_UPDATE);
      showToast({ message: fyo.t`Downloading update` });
    };

    showToast({
      message,
      action,
      actionText: fyo.t`Download Update`,
      duration: 10000,
      type: 'success',
    });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_NOT_AVAILABLE, (_) => {
    showToast({ message: fyo.t`No updates available` });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, (_) => {
    const action = () => {
      ipcRenderer.send(IPC_MESSAGES.INSTALL_UPDATE);
    };
    showToast({
      message: fyo.t`Update downloaded`,
      action,
      actionText: fyo.t`Install Update`,
      duration: 10000,
      type: 'success',
    });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, async (_, error) => {
    error.name = 'Updation Error';
    await handleError(true, error as Error);
  });

  ipcRenderer.on(IPC_CHANNELS.MAIN_PROCESS_ERROR, async (_, error) => {
    console.error('main process error');
    console.error(error);
    await handleError(true, error as Error);
  });

  ipcRenderer.on(IPC_CHANNELS.CONSOLE_LOG, (_, ...stuff: unknown[]) => {
    if (!fyo.store.isDevelopment) {
      return;
    }

    console.log(...stuff);
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
