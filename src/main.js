// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappeVue from 'frappejs/ui/plugins/frappeVue';

// frappejs imports
import frappe from 'frappejs';
import io from 'socket.io-client';
import HTTPClient from 'frappejs/backends/http';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import registerReportMethods from '../reports';

frappe.init();
frappe.registerLibs(common);
frappe.registerModels(coreModels);
frappe.registerModels(models);
const server = 'localhost:8000';
frappe.fetch = window.fetch.bind();
frappe.db = new HTTPClient({ server });
const socket = io.connect(`http://${server}`);
frappe.db.bindSocketClient(socket);
frappe.getSingle('SystemSettings');
registerReportMethods();

frappe.getSingle('AccountingSettings')
  .then(accountingSettings => {
    if (router.currentRoute.fullPath !== '/') return;

    if (accountingSettings.companyName) {
      router.push('/list/ToDo');
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