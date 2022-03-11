import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import { createApp } from 'vue';
import models from '../models';
import App from './App';
import FeatherIcon from './components/FeatherIcon';
import config, { ConfigKeys } from './config';
import { getErrorHandled, handleError } from './errorHandling';
import { IPC_CHANNELS, IPC_MESSAGES } from './messages';
import router from './router';
import telemetry from './telemetry/telemetry';
import { outsideClickDirective } from './ui';
import { setLanguageMap, showToast, stringifyCircular } from './utils';
(async () => {
  const language = config.get('language');
  if (language) {
    await setLanguageMap(language);
  }

  if (process.env.NODE_ENV === 'development') {
    window.config = config;
  }

  frappe.isServer = true;
  frappe.isElectron = true;
  frappe.initializeAndRegister(models, language);
  frappe.fetch = window.fetch.bind();

  ipcRenderer.send = getErrorHandled(ipcRenderer.send);
  ipcRenderer.invoke = getErrorHandled(ipcRenderer.invoke);

  window.frappe = frappe;

  window.onerror = (message, source, lineno, colno, error) => {
    error = error ?? new Error('triggered in window.onerror');
    handleError(true, error, { message, source, lineno, colno });
  };

  process.on('unhandledRejection', (error) => {
    handleError(true, error);
  });

  process.on('uncaughtException', (error) => {
    handleError(true, error, () => process.exit(1));
  });

  registerIpcRendererListeners();

  const app = createApp({
    template: '<App/>',
  });
  app.use(router);
  app.component('App', App);
  app.component('feather-icon', FeatherIcon);
  app.directive('on-outside-click', outsideClickDirective);
  app.mixin({
    computed: {
      frappe() {
        return frappe;
      },
      platform() {
        return {
          win32: 'Windows',
          darwin: 'Mac',
          linux: 'Linux',
        }[process.platform];
      },
    },
    methods: {
      t: frappe.t,
      T: frappe.T,
    },
  });

  app.config.errorHandler = (err, vm, info) => {
    const more = {
      info,
    };

    if (vm) {
      const { fullPath, params } = vm.$route;
      more.fullPath = fullPath;
      more.params = stringifyCircular(params ?? {});
      more.data = stringifyCircular(vm.$data ?? {}, true, true);
      more.props = stringifyCircular(vm.$props ?? {}, true, true);
    }

    handleError(false, err, more);
    console.error(err, vm, info);
  };

  incrementOpenCount();
  app.mount('body');
})();

function incrementOpenCount() {
  let openCount = config.get(ConfigKeys.OpenCount);
  if (typeof openCount !== 'number') {
    openCount = 1;
  } else {
    openCount += 1;
  }

  config.set(ConfigKeys.OpenCount, openCount);
}

function registerIpcRendererListeners() {
  ipcRenderer.on(IPC_CHANNELS.STORE_ON_WINDOW, (event, message) => {
    Object.assign(window.frappe.store, message);
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
    if (document.visibilityState !== 'hidden') {
      return;
    }

    const telemetryData = telemetry.stop();
    navigator.sendBeacon('http://0.0.0.0:6969', telemetryData);
  });
}
