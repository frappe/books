import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import { createApp } from 'vue';
import { getBuiltTestSchemaMap } from '../backend/database/tests/helpers';
import { getSchemas } from '../schemas';
import App from './App';
import FeatherIcon from './components/FeatherIcon';
import config, { ConfigKeys } from './config';
import { getErrorHandled, handleError } from './errorHandling';
import { IPC_ACTIONS } from './messages';
import { incrementOpenCount } from './renderer/helpers';
import registerIpcRendererListeners from './renderer/registerIpcRendererListeners';
import router from './router';
import { outsideClickDirective } from './ui';
import { setLanguageMap, stringifyCircular } from './utils';

(async () => {
  const language = config.get(ConfigKeys.Language);
  if (language) {
    await setLanguageMap(language);
  }

  if (process.env.NODE_ENV === 'development') {
    window.config = config;
  }

  frappe.isServer = true;
  frappe.isElectron = true;

  const models = (await import('../models')).default;
  await frappe.initializeAndRegister(models);

  ipcRenderer.send = getErrorHandled(ipcRenderer.send);
  ipcRenderer.invoke = getErrorHandled(ipcRenderer.invoke);

  window.frappe = frappe;

  window.onerror = (message, source, lineno, colno, error) => {
    error = error ?? new Error('triggered in window.onerror');
    handleError(true, error, { message, source, lineno, colno });
  };

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
        switch (process.platform) {
          case 'win32':
            return 'Windows';
          case 'darwin':
            return 'Mac';
          case 'linux':
            return 'Linux';
          default:
            return 'Linux';
        }
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

  frappe.store.appVersion = await ipcRenderer.invoke(IPC_ACTIONS.GET_VERSION);
  incrementOpenCount();
  app.mount('body');

  process.on('unhandledRejection', (error) => {
    handleError(true, error);
  });

  process.on('uncaughtException', (error) => {
    handleError(true, error, {}, () => process.exit(1));
  });
})();

window.gs = getSchemas;
window.gst = getBuiltTestSchemaMap;
