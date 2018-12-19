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

  frappe.events.on('connect-database', async (filepath) => {
    await connectToLocalDatabase(filepath);
    frappe.events.trigger('show-desk');
  });

  frappe.events.on('DatabaseSelector:file-selected', async (filepath) => {
    await connectToLocalDatabase(filepath);

    localStorage.dbPath = filepath;

    const accountingSettings = await frappe.getSingle('AccountingSettings');
    if (!accountingSettings.companyName) {
      frappe.events.trigger('show-setup-wizard');
    } else {
      frappe.events.trigger('show-desk');
    }
  });

  frappe.events.on('SetupWizard:setup-complete', async (setupWizardValues) => {
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
      fiscalYearEnd
    });

    await doc.update();
    await frappe.call({ method: 'import-coa' });
    
    if(country === "India"){
      frappe.models.Party = require('../models/doctype/Party/RegionalChanges.js')
      await frappe.db.migrate()
      await generateGstTaxes();
    }
    frappe.events.trigger('show-desk');
  });

  async function generateGstTaxes() {
    const gstPercents = [5, 12, 18, 28];
    const gstTypes = ['Out of State', 'In State'];
    let newTax = await frappe.getNewDoc('Tax');
    for (const type of gstTypes) {
      for (const percent of gstPercents) {
        switch (type) {
          case 'Out of State':
          console.log(type)
            await newTax.set({
              name: `${type}-${percent}`,
              details: [{
                account: "IGST",
                rate: percent
              }]
            })
            break;
          case 'In State':
            console.log(type)
            await newTax.set({
              name: `${type}-${percent}`,
              details: [{
                  account: "CGST",
                  rate: percent/2
                },
                {
                  account: "SGST",
                  rate: percent/2
                }
              ]
            })
            break;
        }
        await newTax.insert();
      }
    }
    await newTax.set({
      name: `Exempt-0`,
      details: [{
        account: "Exempt",
        rate: 0
      }]
    })
    await newTax.insert();
  }

  async function connectToLocalDatabase(filepath) {
    frappe.login('Administrator');
    frappe.db = new SQLite({ dbPath: filepath });
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
