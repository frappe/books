import Vue from 'vue';
import Router from 'vue-router';
import coreRoutes from 'frappejs/ui/routes';

import Report from 'frappejs/ui/pages/Report';
import reportViewConfig from '../../reports/view';

Vue.use(Router);

const routes = [
  ...coreRoutes,
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
  }
];

export default new Router({ routes });
