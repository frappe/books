import ChartOfAccounts from '@/pages/ChartOfAccounts';
// standard views
import Dashboard from '@/pages/Dashboard/Dashboard';
import DataImport from '@/pages/DataImport';
// custom views
import GetStarted from '@/pages/GetStarted';
import InvoiceForm from '@/pages/InvoiceForm';
import JournalEntryForm from '@/pages/JournalEntryForm';
import ListView from '@/pages/ListView/ListView';
import PrintView from '@/pages/PrintView/PrintView';
import QuickEditForm from '@/pages/QuickEditForm';
import Report from '@/pages/Report';
import Settings from '@/pages/Settings/Settings';
import { createRouter, createWebHistory } from 'vue-router';
import telemetry from './telemetry/telemetry';
import { NounEnum, Verb } from './telemetry/types';

const routes = [
  {
    path: '/',
    component: Dashboard,
  },
  {
    path: '/get-started',
    component: GetStarted,
  },
  {
    path: '/edit/JournalEntry/:name',
    name: 'JournalEntryForm',
    components: {
      default: JournalEntryForm,
      edit: QuickEditForm,
    },
    props: {
      default: (route) => {
        // for sidebar item active state
        route.params.doctype = 'JournalEntry';
        return {
          doctype: 'JournalEntry',
          name: route.params.name,
        };
      },
      edit: (route) => route.query,
    },
  },
  {
    path: '/edit/:doctype/:name',
    name: 'InvoiceForm',
    components: {
      default: InvoiceForm,
      edit: QuickEditForm,
    },
    props: {
      default: true,
      edit: (route) => route.query,
    },
  },
  {
    path: '/list/:doctype/:fieldname?/:value?',
    name: 'ListView',
    components: {
      default: ListView,
      edit: QuickEditForm,
    },
    props: {
      default: (route) => {
        let { doctype, filters, fieldname, value } = route.params;
        if (filters === undefined && fieldname && value) {
          filters = { [fieldname]: value };
        }

        return {
          doctype,
          filters,
        };
      },
      edit: (route) => route.query,
    },
  },
  {
    path: '/print/:doctype/:name',
    name: 'PrintView',
    component: PrintView,
    props: true,
  },
  {
    path: '/report/:reportName',
    name: 'Report',
    component: Report,
    props: true,
  },
  {
    path: '/chart-of-accounts',
    name: 'Chart Of Accounts',
    components: {
      default: ChartOfAccounts,
      edit: QuickEditForm,
    },
    props: {
      default: true,
      edit: (route) => route.query,
    },
  },
  {
    path: '/data_import',
    name: 'Data Import',
    component: DataImport,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    props: true,
  },
];

let router = createRouter({ routes, history: createWebHistory() });

router.afterEach((to, from, failure) => {
  const more = { from: from.fullPath, to: to.fullPath };
  telemetry.log(Verb.Navigated, NounEnum.Route, more);
});

if (process.env.NODE_ENV === 'development') {
  window.router = router;
}

export default router;
