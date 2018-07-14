// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappeVue from 'frappejs/ui/plugins/frappeVue';

// frappejs imports
import frappe from 'frappejs';
import sqlite from 'frappejs/backends/sqlite';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import postStart from '../server/postStart';

frappe.init();
frappe.registerLibs(common);
frappe.registerModels(coreModels);
frappe.registerModels(models);

frappe.fetch = window.fetch.bind();
frappe.isServer = true;

frappe.db = new sqlite({ dbPath: 'electron.db' });
frappe.db.connect()
  .then(() => {
    frappe.db.migrate();
  });

frappe.getSingle('SystemSettings');
frappe.getSingle('AccountingSettings')
  .then(accountingSettings => {
    if (router.currentRoute.fullPath !== '/') return;

    if (accountingSettings.companyName) {
      router.push('/list/ToDo');
    } else {
      router.push('/setup-wizard');
    }
  });

frappe.login('Administrator');

// server postStart
postStart();

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
