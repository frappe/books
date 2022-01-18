import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import Vue from 'vue';
import models from '../models';
import App from './App';
import FeatherIcon from './components/FeatherIcon';
import { handleError } from './errorHandling';
import { IPC_MESSAGES } from './messages';
import router from './router';
import { outsideClickDirective } from './ui';
import { stringifyCircular } from './utils';

(async () => {
  frappe.isServer = true;
  frappe.isElectron = true;
  frappe.initializeAndRegister(models);
  frappe.fetch = window.fetch.bind();

  frappe.events.on('reload-main-window', () => {
    ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
  });

  frappe.events.on('check-for-updates', () => {
    let { autoUpdate } = frappe.SystemSettings;
    if (autoUpdate == null || autoUpdate === 1) {
      ipcRenderer.send(IPC_MESSAGES.CHECK_FOR_UPDATES);
    }
  });

  window.frappe = frappe;
  window.frappe.store = {};

  ipcRenderer.on('store-on-window', (event, message) => {
    Object.assign(window.frappe.store, message);
  });

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

  process.on('unhandledRejection', (error) => {
    handleError(true, error);
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
