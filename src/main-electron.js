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
  frappe.events.on('connect-database', async filepath => {
    await connectToLocalDatabase(filepath);

    const { completed } = await frappe.getSingle('SetupWizard');

    if (!completed) {
      frappe.events.trigger('show-setup-wizard');
      return;
    }

    const { country } = await frappe.getSingle('AccountingSettings');

    if (country === 'India') {
      frappe.models.Party = require('../models/doctype/Party/RegionalChanges.js');
    } else {
      frappe.models.Party = require('../models/doctype/Party/Party.js');
    }
    frappe.events.trigger('show-desk');
  });

  frappe.events.on('DatabaseSelector:file-selected', async filepath => {
    await connectToLocalDatabase(filepath);

    localStorage.dbPath = filepath;

    const { companyName } = await frappe.getSingle('AccountingSettings');
    if (!companyName) {
      frappe.events.trigger('show-setup-wizard');
    } else {
      frappe.events.trigger('show-desk');
    }
  });

  frappe.events.on('SetupWizard:setup-complete', async setupWizardValues => {
    const countryList = require('../fixtures/countryInfo.json');
    const {
      companyName,
      country,
      name,
      email,
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
      fiscalYearEnd,
      currency: countryList[country]['currency']
    });

    await doc.update();

    const systemSettings = await frappe.getSingle('SystemSettings');
    await systemSettings.set({
      dateFormat: countryList[country]['date_format'] || 'yyyy-MM-dd'
    });
    await systemSettings.update();

    await setupAccountsAndDashboard(bankName);
    await setupRegionalChanges(country);

    await setupWizardValues.set({ completed: 1 });
    await setupWizardValues.update();

    frappe.events.trigger('show-desk');
  });

  async function setupAccountsAndDashboard(bankName) {
    await frappe.call({
      method: 'import-coa'
    });

    const accountDoc = await frappe.newDoc({
      doctype: 'Account'
    });
    Object.assign(accountDoc, {
      name: bankName,
      rootType: 'Asset',
      parentAccount: 'Bank Accounts',
      accountType: 'Bank',
      isGroup: 0
    });
    accountDoc.insert();

    const dashboardSettings = await frappe.getSingle('DashboardSettings');
    const accounts = await frappe.db.getAll({
      doctype: 'Account',
      filters: { parentAccount: ['in', ['', undefined, null]] }
    });

    const colors = [
      { name: 'Red', hexvalue: '#d32f2f' },
      { name: 'Green', hexvalue: '#388e3c' },
      { name: 'Blue', hexvalue: '#0288d1' },
      { name: 'Yellow', hexvalue: '#cddc39' }
    ];
    colors.forEach(async color => {
      const c = await frappe.newDoc({ doctype: 'Color' });
      c.set(color);
      c.insert();
    });

    let charts = [];
    accounts.forEach(account => {
      charts.push({
        account: account.name,
        type: 'Bar',
        color: colors[Math.floor(Math.random() * 4)].name
      });
    });

    await dashboardSettings.set({
      charts
    });
    await dashboardSettings.update();
  }

  async function setupRegionalChanges(country) {
    const generateRegionalTaxes = require('../models/doctype/Tax/RegionalChanges');
    await generateRegionalTaxes(country);
    if (country === 'India') {
      frappe.models.Party = require('../models/doctype/Party/RegionalChanges');
      await frappe.db.migrate();
    }
  }

  async function connectToLocalDatabase(filepath) {
    try {
      frappe.login('Administrator');
      frappe.db = new SQLite({
        dbPath: filepath
      });
      await frappe.db.connect();
      await frappe.db.migrate();
      frappe.getSingle('SystemSettings');
      await postStart();
    } catch (e) {
      console.log(e);
    }
  }

  window.frappe = frappe;

  Vue.config.productionTip = false;
  Vue.use(frappeVue);
  Vue.use(Toasted, {
    position: 'bottom-right',
    duration: 3000
  });

  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    router,
    components: {
      App
    },
    template: '<App/>'
  });
})();
