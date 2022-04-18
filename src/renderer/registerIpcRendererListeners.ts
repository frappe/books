import { handleError } from '@/errorHandling';
import { IPC_CHANNELS, IPC_MESSAGES } from 'utils/messages';
import telemetry from 'frappe/telemetry/telemetry';
import { showToast } from '@/utils';
import { ipcRenderer } from 'electron';
import frappe from 'frappe';

export default function registerIpcRendererListeners() {
  ipcRenderer.on(IPC_CHANNELS.STORE_ON_WINDOW, (event, message) => {
    Object.assign(frappe.store, message);
  });

  ipcRenderer.on(IPC_CHANNELS.CHECKING_FOR_UPDATE, (_) => {
    showToast({ message: frappe.t`Checking for updates` });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, (_, version) => {
    const message = version
      ? frappe.t`Version ${version} available`
      : frappe.t`New version available`;
    const action = () => {
      ipcRenderer.send(IPC_MESSAGES.DOWNLOAD_UPDATE);
      showToast({ message: frappe.t`Downloading update` });
    };

    showToast({
      message,
      action,
      actionText: frappe.t`Download Update`,
      duration: 10000,
      type: 'success',
    });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_NOT_AVAILABLE, (_) => {
    showToast({ message: frappe.t`No updates available` });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, (_) => {
    const action = () => {
      ipcRenderer.send(IPC_MESSAGES.INSTALL_UPDATE);
    };
    showToast({
      message: frappe.t`Update downloaded`,
      action,
      actionText: frappe.t`Install Update`,
      duration: 10000,
      type: 'success',
    });
  });

  ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, (_, error) => {
    error.name = 'Updation Error';
    handleError(true, error);
  });
  
  document.addEventListener('visibilitychange', function () {
    const { visibilityState } = document;
    if (visibilityState === 'visible' && !telemetry.started) {
      telemetry.start();
    }

    if (visibilityState !== 'hidden') {
      return;
    }

    telemetry.stop();
  });
}
