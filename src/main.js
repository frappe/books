// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappeVue from 'frappejs/ui/plugins/frappeVue';

// frappejs imports
import frappe from 'frappejs';
import frappeConf from '../frappe.conf';
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
const server = `localhost:${frappeConf.dev.devServerPort}`;
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
      frappe.events.trigger('show-desk');
    } else {
      frappe.events.trigger('show-setup-wizard');
    }
  });

frappe.events.on('SetupWizard:setup-complete', async ({ setupWizardValues }) => {
  const {
    companyName,
    country,
    name,
    email,
    abbreviation,
    bankName,
    fiscalYearStart,
    fiscalYearEnd
  } = setupWizardValues;

  const doc = await frappe.getSingle('AccountingSettings');
  await doc.set({
    companyName,
    country,
    fullname: name,
    email,
    bankName,
    fiscalYearStart,
    fiscalYearEnd
  });

  await doc.update();
  await frappe.call({ method: 'import-coa' });

  frappe.events.trigger('show-desk');
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
