// frappejs imports
import frappe from 'frappejs';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import FeatherIcon from 'frappejs/ui/components/FeatherIcon';
import outsideClickDirective from 'frappejs/ui/plugins/outsideClickDirective';
import models from '../models';

// vue imports
import Vue from 'vue';
import PortalVue from 'portal-vue';
import App from './App';
import router from './router';

// other imports
import { ipcRenderer } from 'electron';
import { IPC_MESSAGES } from './messages';

(async () => {
  frappe.isServer = true;
  frappe.isElectron = true;
  frappe.init();
  frappe.registerLibs(common);
  frappe.registerModels(coreModels);
  frappe.registerModels(models);
  frappe.fetch = window.fetch.bind();

  frappe.events.on('reload-main-window', () => {
    ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
  });

  frappe.events.on('check-for-updates', () => {
    let { autoUpdate } = frappe.AccountingSettings;
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
  Vue.use(PortalVue);
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
