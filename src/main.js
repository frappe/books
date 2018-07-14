// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappeVue from 'frappejs/ui/plugins/frappeVue';

// frappejs imports
// import io from 'socket.io-client';
import frappe from 'frappejs';
import sqlite from 'frappejs/backends/sqlite';
import Observable from 'frappejs/utils/observable';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import registerReportMethods from '../reports';
import naming from 'frappejs/model/naming';

frappe.init();
frappe.registerLibs(common);
frappe.registerModels(coreModels);
frappe.registerModels(models);
const server = 'localhost:8000';
frappe.fetch = window.fetch.bind();

frappe.isServer = true;

frappe.db = new sqlite({ dbPath: 'electron.db' });
frappe.db.connect()
  .then(() => {
    frappe.db.migrate();
  });

// frappe.db = new HTTPClient({ server });
// const socket = io.connect(`http://${server}`);
// frappe.db.bindSocketClient(socket);
frappe.registerModels(models);
frappe.docs = new Observable();
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

frappe.login('Administrator');

// postStart

frappe.models.Invoice.documentClass = require('../models/doctype/Invoice/InvoiceServer.js');
frappe.models.Payment.documentClass = require('../models/doctype/Payment/PaymentServer.js');
frappe.models.Bill.documentClass = require('../models/doctype/Bill/BillServer.js');
frappe.models.JournalEntry.documentClass = require('../models/doctype/JournalEntry/JournalEntryServer.js');

frappe.metaCache = {};

frappe.syncDoc(require('../fixtures/invoicePrint'));

// init naming series if missing
naming.createNumberSeries('INV-', 'InvoiceSettings');
naming.createNumberSeries('BILL-', 'BillSettings');
naming.createNumberSeries('PAY-', 'PaymentSettings');
naming.createNumberSeries('JV-', 'JournalEntrySettings');
naming.createNumberSeries('QTN-', 'QuotationSettings');
naming.createNumberSeries('SO-', 'SalesOrderSettings');
naming.createNumberSeries('OF-', 'FulfillmentSettings');
naming.createNumberSeries('PO-', 'PurchaseOrderSettings');
naming.createNumberSeries('PREC-', 'PurchaseReceiptSettings');

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
