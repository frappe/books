// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';

// frappejs imports
import io from 'socket.io-client';
import frappe from 'frappejs';
import HTTPClient from 'frappejs/backends/http';
import Observable from 'frappejs/utils/observable';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import { _ } from 'frappejs/utils';

// vue components
import NotFound from 'frappejs/ui/components/NotFound';
import FeatherIcon from 'frappejs/ui/components/FeatherIcon';
import FrappeControl from 'frappejs/ui/components/controls/FrappeControl';
import Button from 'frappejs/ui/components/Button';
import Indicator from 'frappejs/ui/components/Indicator';
import modalPlugin from 'frappejs/ui/plugins/modal';
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
frappe.registerModels(models);
frappe.docs = new Observable();
frappe.getSingle('SystemSettings');
registerReportMethods();

frappe.getSingle('AccountingSettings')
  .then(accountingSettings => {
    if (accountingSettings.companyName) {
      router.push('/list/ToDo');
    } else {
      router.push('/setup-wizard');
    }
  });

window.frappe = frappe;

Vue.config.productionTip = false;

Vue.component('not-found', NotFound);
Vue.component('feather-icon', FeatherIcon);
Vue.component('frappe-control', FrappeControl);
Vue.component('f-button', Button);
Vue.component('indicator', Indicator);

Vue.use(modalPlugin);

Vue.mixin({
  methods: {
    // global translation function in every component
    _(...args) {
      return _(...args);
    }
  }
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
});