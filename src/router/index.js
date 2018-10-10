import Vue from 'vue';
import Router from 'vue-router';
import coreRoutes from 'frappejs/ui/routes';

import Report from 'frappejs/ui/pages/Report';
import reportViewConfig from '../../reports/view';

import DataImport from '../pages/DataImport';

Vue.use(Router);

const routes = [].concat(coreRoutes, [
  {
    path: '/report/:reportName',
    name: 'Report',
    component: Report,
    props: (route) => {
      const { reportName } = route.params;
      return {
        reportName,
        reportConfig: reportViewConfig[reportName] || null,
        filters: route.query
      };
    }
  },
  {
    path: '/data-import',
    name: 'Data Import',
    component: DataImport
  }
]);

export default new Router({ routes });
