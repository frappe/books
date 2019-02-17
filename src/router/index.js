import Vue from 'vue';
import Router from 'vue-router';

import ListView from '../pages/ListView';
import FormView from '../pages/FormView/FormView';
import PrintView from '../pages/PrintView';

import Report from 'frappejs/ui/pages/Report';
import reportViewConfig from '../../reports/view';

import DataImport from '../pages/DataImport';

import Settings from '../pages/Settings/Settings';

import ReportList from '../pages/Report';

import Tree from 'frappejs/ui/components/Tree';

Vue.use(Router);

const routes = [
  {
    path: '/list/:listName',
    name: 'ListView',
    component: ListView,
    props: true
  },
  {
    path: '/edit/:doctype/:name',
    name: 'FormView',
    component: FormView,
    props: true
  },
  {
    path: '/print/:doctype/:name',
    name: 'PrintView',
    component: PrintView,
    props: true
  },
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
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/reportList',
    name: 'Report',
    component: ReportList
  },
  {
    path: '/tree/:doctype',
    name: 'Tree',
    component: Tree,
    props: true
  },
];

export default new Router({ routes });
