// frappejs imports
import frappe from 'frappejs';
import SQLite from 'frappejs/backends/sqlite';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import FeatherIcon from 'frappejs/ui/components/FeatherIcon';
import outsideClickDirective from 'frappejs/ui/plugins/outsideClickDirective';
import models from '../models';
import postStart from '../server/postStart';
import { ipcRenderer } from 'electron';

// vue imports
import Vue from 'vue';
import PortalVue from 'portal-vue';
import App from './App';
import router from './router';

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

  frappe.events.on('reload-main-window', () => {
    ipcRenderer.send('reload-main-window');
  });

  frappe.events.on('check-for-updates', () => {
    let { autoUpdate } = frappe.AccountingSettings;
    if (autoUpdate == null || autoUpdate === 1) {
      ipcRenderer.send('check-for-updates');
    }
  });

  frappe.events.on('SetupWizard:setup-complete', async setupWizardValues => {
    const countryList = require('../fixtures/countryInfo.json');
    const {
      companyLogo,
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

    const printSettings = await frappe.getSingle('PrintSettings');
    printSettings.set({
      logo: companyLogo,
      companyName,
      email,
      displayLogo: companyLogo ? 1 : 0
    });
    await printSettings.update();

    await setupGlobalCurrencies(countryList);
    await setupChartOfAccounts(bankName);
    await setupRegionalChanges(country);

    await setupWizardValues.set({ completed: 1 });
    await setupWizardValues.update();

    frappe.events.trigger('show-desk');
  });

  async function setupGlobalCurrencies(countries) {
    const promises = [];
    const queue = [];
    for (let country of Object.values(countries)) {
      const {
        currency,
        currency_fraction: fraction,
        currency_fraction_units: fractionUnits,
        smallest_currency_fraction_value: smallestValue,
        currency_symbol: symbol,
        number_format: numberFormat
      } = country;

      if (currency) {
        const exists = queue.includes(currency);
        if (!exists) {
          const doc = await frappe.newDoc({
            doctype: 'Currency',
            name: currency,
            fraction,
            fractionUnits,
            smallestValue,
            symbol,
            numberFormat: numberFormat || '#,###.##'
          });
          promises.push(doc.insert());
          queue.push(currency);
        }
      }
    }
    return Promise.all(promises);
  }

  async function setupChartOfAccounts(bankName) {
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
    frappe.login('Administrator');
    frappe.db = new SQLite({
      dbPath: filepath
    });
    await frappe.db.connect();
    await frappe.db.migrate();
    await postStart();
  }

  window.frappe = frappe;

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
          linux: 'Linux'
        }[process.platform];
      }
    },
    methods: {
      _(...args) {
        return frappe._(...args);
      }
    }
  });

  Vue.config.errorHandler = (err, vm, info) => {
    console.error(err, vm, info);
  };

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
