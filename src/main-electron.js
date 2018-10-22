// frappejs imports
import frappe from 'frappejs';
import path from 'path';
import SQLite from 'frappejs/backends/sqlite';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import postStart from '../server/postStart';
import { getSettings, saveSettings } from '../electron/settings';

// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappeVue from 'frappejs/ui/plugins/frappeVue';
import Toasted from 'vue-toasted';

(async () => {
  frappe.isServer = true;
  frappe.isElectron = true;
  frappe.init();
  frappe.registerLibs(common);
  frappe.registerModels(coreModels);
  frappe.registerModels(models);
  frappe.fetch = window.fetch.bind();

  const electronSettings = getSettings();
  if (!electronSettings.dbPath) {
    localStorage.showDesk = false;
  } else {
    await connectToLocalDatabase();
    localStorage.showDesk = true;
  }

  frappe.events.on('SetupWizard:setup-complete', async ({ setupWizardValues }) => {
    const {
      file,
      companyName,
      country,
      name,
      email,
      bankName,
      fiscalYearStart,
      fiscalYearEnd
    } = setupWizardValues;

    // db init
    const dbPath = path.join(file[0].path, 'frappe-accounting.db');
    await saveSettings({ dbPath });
    await connectToLocalDatabase();

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

  async function connectToLocalDatabase() {
    const electronSettings = getSettings();
    frappe.login('Administrator');
    frappe.db = new SQLite({ dbPath: electronSettings.dbPath });
    await frappe.db.connect();
    await frappe.db.migrate();
    frappe.getSingle('SystemSettings');
    await postStart();
  }

  window.frappe = frappe;

  Vue.config.productionTip = false;
  Vue.use(frappeVue);
  Vue.use(Toasted, {
    position: 'bottom-right',
    duration : 3000
 });

  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    router,
    components: { App },
    template: '<App/>'
  });
})()
