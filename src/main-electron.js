// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappeVue from 'frappejs/ui/plugins/frappeVue';

// frappejs imports
import frappe from 'frappejs';
import frappeConf from '../frappe.conf';
import HTTPClient from 'frappejs/backends/http';
import SQLite from 'frappejs/backends/sqlite';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import registerReportMethods from '../reports';

console.log('electron is here')

frappe.init();
frappe.registerLibs(common);
frappe.registerModels(coreModels);
frappe.registerModels(models);
frappe.fetch = window.fetch.bind();
frappe.db = new SQLite({ dbPath: 'test.db' });

frappe.getSingle('SystemSettings');
registerReportMethods();

frappe.getSingle('AccountingSettings')
  .then(accountingSettings => {
    if (router.currentRoute.fullPath !== '/') return;

    if (accountingSettings.companyName) {
      router.push('/tree/Account');
    } else {
      router.push('/setup-wizard');
    }
  });

window.frappe = frappe;

Vue.config.productionTip = false;
Vue.use(frappeVue);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
});
