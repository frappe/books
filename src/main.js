import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import Vue from 'vue';
import models from '../models';
import App from './App';
import FeatherIcon from './components/FeatherIcon';
import { IPC_MESSAGES } from './messages';
import router from './router';
import { outsideClickDirective } from './ui';

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
      _(...args) {
        return frappe._(...args);
      },
    },
  });

  Vue.config.errorHandler = (err, vm, info) => {
    console.error(err, vm, info);
  };

  process.on('unhandledRejection', (error) => {
    console.error(error);
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
