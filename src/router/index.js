import Vue from 'vue';
import Router from 'vue-router';
import coreRoutes from 'frappejs/ui/routes';

import Report from 'frappejs/ui/pages/Report';
import reportViewConfig from '../../reports/view';
import EmailListForm from '../pages/Email/EmailListForm';
import EmailAccount from '../pages/EmailAccount/EmailAccount';

import DataImport from '../pages/DataImport';

Vue.use(Router);

const routes = [].concat(coreRoutes, [{
    path: '/report/:reportName',
    name: 'Report',
    component: Report,
    props: (route) => {
      const {
        reportName
      } = route.params;
      return {
        reportName,
        reportConfig: reportViewConfig[reportName] || null,
        filters: route.query
      };
    }
  },
  {
    path: '/view/:doctype/:tab/:name',
    name: 'Email Receive Form',
    component: EmailListForm,
    props: true
  },
  {
    path: '/list/:doctype/:tab',
    name: 'Email',
    component: EmailListForm,
    props: true
  },
  {
    path: '/list/:doctype',
    name: 'Email Account',
    component: EmailAccount,
    props: true
  }, {
    path: '/data-import',
    name: 'Data Import',
    component: DataImport
  }
]);

export default new Router({
  routes
});
