import Vue from 'vue';
import Router from 'vue-router';

import ListView from '@/pages/ListView/ListView';
import Dashboard from '@/pages/Dashboard';
import FormView from '@/pages/FormView/FormView';
import PrintView from '@/pages/PrintView';
import QuickEditForm from '@/pages/QuickEditForm';

import Report from '@/pages/Report';
import reportViewConfig from '../reports/view';

import DataImport from '@/pages/DataImport';

import Settings from '@/pages/Settings/Settings';

import ReportList from '@/pages/ReportList';
import ChartOfAccounts from '@/pages/ChartOfAccounts';

import InvoiceForm from '@/pages/InvoiceForm';

import Tree from 'frappejs/ui/components/Tree';

Vue.use(Router);

const routes = [
  {
    path: '/',
    component: Dashboard
  },
  {
    path: '/edit/SalesInvoice/:name',
    name: 'InvoiceForm',
    components: {
      default: InvoiceForm,
      edit: QuickEditForm
    },
    props: {
      default: true,
      edit: route => route.query
    }
  },
  {
    path: '/list/:doctype',
    name: 'ListView',
    components: {
      default: ListView,
      edit: QuickEditForm
    },
    props: {
      default: route => {
        const { doctype } = route.params;
        return {
          doctype,
          filters: route.query.filters
        };
      },
      edit: route => route.query
    }
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
    props: route => {
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
  {
    path: '/chartOfAccounts',
    name: 'Chart Of Accounts',
    component: ChartOfAccounts,
    props: true
  }
];

let router = new Router({ routes });
router.replace('/list/Item');

export default router;
