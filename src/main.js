import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import Vue from 'vue';
import models from '../models';
import App from './App';
import FeatherIcon from './components/FeatherIcon';
import { getErrorHandled, handleError } from './errorHandling';
import { IPC_CHANNELS, IPC_MESSAGES } from './messages';
import router from './router';
import { outsideClickDirective } from './ui';
import { stringifyCircular } from './utils';

function registerIpcRendererListeners() {
  ipcRenderer.on(IPC_CHANNELS.STORE_ON_WINDOW, (event, message) => {
    Object.assign(window.frappe.store, message);
  });

  ipcRenderer.on('wc-message', (event, message) => {
    console.log(message);
  });
}

(async () => {
  frappe.isServer = true;
  frappe.isElectron = true;
  frappe.initializeAndRegister(models);
  frappe.fetch = window.fetch.bind();

  ipcRenderer.send = getErrorHandled(ipcRenderer.send);
  ipcRenderer.invoke = getErrorHandled(ipcRenderer.invoke);

  frappe.events.on('reload-main-window', () => {
    ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
  });

  window.frappe = frappe;
  window.frappe.store = {};

  registerIpcRendererListeners();

  Vue.config.productionTip = false;
  Vue.component('feather-icon', FeatherIcon);
  Vue.directive('on-outside-click', outsideClickDirective);
  Vue.mixin({
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

  Vue.config.errorHandler = (err, vm, info) => {
    const { fullPath, params } = vm.$route;
    const data = stringifyCircular(vm.$data, true, true);
    const props = stringifyCircular(vm.$props, true, true);

    handleError(false, err, {
      fullPath,
      params: stringifyCircular(params),
      data,
      props,
      info,
    });
    console.error(err, vm, info);
  };

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

  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    router,
    components: {
      App,
    },
    template: '<App/>',
  });
})();
