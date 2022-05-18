import { NounEnum, Verb } from 'fyo/telemetry/types';
import ChartOfAccounts from 'src/pages/ChartOfAccounts.vue';
import Dashboard from 'src/pages/Dashboard/Dashboard.vue';
import DataImport from 'src/pages/DataImport.vue';
import GetStarted from 'src/pages/GetStarted.vue';
import InvoiceForm from 'src/pages/InvoiceForm.vue';
import JournalEntryForm from 'src/pages/JournalEntryForm.vue';
import ListView from 'src/pages/ListView/ListView.vue';
import PrintView from 'src/pages/PrintView/PrintView.vue';
import QuickEditForm from 'src/pages/QuickEditForm.vue';
import Report from 'src/pages/Report.vue';
import Settings from 'src/pages/Settings/Settings.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { fyo } from './initFyo';

const routes: RouteRecordRaw[] = [
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
        route.params.schemaName = 'JournalEntry';
        return {
          schemaName: 'JournalEntry',
          name: route.params.name,
        };
      },
      edit: (route) => route.query,
    },
  },
  {
    path: '/edit/:schemaName/:name',
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
    path: '/list/:schemaName/:fieldname?/:value?/:pageTitle?',
    name: 'ListView',
    components: {
      default: ListView,
      edit: QuickEditForm,
    },
    props: {
      default: (route) => {
        const { schemaName, fieldname, value, pageTitle } = route.params;
        let { filters } = route.params;

        if (filters === undefined && fieldname && value) {
          // @ts-ignore
          filters = { [fieldname as string]: value };
        }

        return {
          schemaName,
          filters,
          pageTitle: pageTitle ?? '',
        };
      },
      edit: (route) => {
        return route.query;
      },
    },
  },
  {
    path: '/print/:schemaName/:name',
    name: 'PrintView',
    component: PrintView,
    props: true,
  },
  {
    path: '/report/:reportClassName',
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
    path: '/data-import',
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

const router = createRouter({ routes, history: createWebHistory() });

function removeDetails(path: string) {
  if (!path) {
    return path;
  }

  const match = path.match(/edit=1/);
  if (!match) {
    return path;
  }

  return path.slice(0, match.index! + 4);
}

router.afterEach((to, from) => {
  const more = {
    from: removeDetails(from.fullPath),
    to: removeDetails(to.fullPath),
  };

  fyo.telemetry.log(Verb.Navigated, NounEnum.Route, more);
});

export default router;
