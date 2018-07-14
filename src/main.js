// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

// vue imports
import Vue from 'vue';
import App from './App';
import router from './router';
import frappe from 'frappejs';
import frappeVue from 'frappejs/ui/plugins/frappeVue';

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
