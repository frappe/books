import { ModelNameEnum } from 'models/types';
import ChartOfAccounts from 'src/pages/ChartOfAccounts.vue';
import Dashboard from 'src/pages/Dashboard/Dashboard.vue';
import DataImport from 'src/pages/DataImport.vue';
import GeneralForm from 'src/pages/GeneralForm.vue';
import GetStarted from 'src/pages/GetStarted.vue';
import InvoiceForm from 'src/pages/InvoiceForm.vue';
import JournalEntryForm from 'src/pages/JournalEntryForm.vue';
import ListView from 'src/pages/ListView/ListView.vue';
import PrintView from 'src/pages/PrintView/PrintView.vue';
import QuickEditForm from 'src/pages/QuickEditForm.vue';
import Report from 'src/pages/Report.vue';
import Settings from 'src/pages/Settings/Settings.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

function getGeneralFormItems(): RouteRecordRaw[] {
  return [ModelNameEnum.Shipment, ModelNameEnum.PurchaseReceipt].map(
    (schemaName) => {
      return {
        path: `/edit/${schemaName}/:name`,
        name: `${schemaName}Form`,
        components: {
          default: GeneralForm,
          edit: QuickEditForm,
        },
        props: {
          default: (route) => {
            route.params.schemaName = schemaName;
            return {
              schemaName,
              name: route.params.name,
            };
          },
          edit: (route) => route.query,
        },
      };
    }
  );
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Dashboard,
  },
  {
    path: '/get-started',
    component: GetStarted,
  },
  ...getGeneralFormItems(),
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
    path: '/list/:schemaName/:pageTitle?',
    name: 'ListView',
    components: {
      default: ListView,
      edit: QuickEditForm,
    },
    props: {
      default: (route) => {
        const { schemaName } = route.params;
        const pageTitle = route.params.pageTitle ?? '';

        const filters = {};
        const filterString = route.query.filters;
        if (typeof filterString === 'string') {
          Object.assign(filters, JSON.parse(filterString));
        }

        return {
          schemaName,
          filters,
          pageTitle,
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
    components: {
      default: Settings,
      edit: QuickEditForm,
    },
    props: {
      default: true,
      edit: (route) => route.query,
    },
  },
];

export function getEntryRoute(schemaName: string, name: string) {
  if (
    [
      ModelNameEnum.SalesInvoice,
      ModelNameEnum.PurchaseInvoice,
      ModelNameEnum.JournalEntry,
      ModelNameEnum.Shipment,
      ModelNameEnum.PurchaseReceipt,
    ].includes(schemaName as ModelNameEnum)
  ) {
    return `/edit/${schemaName}/${name}`;
  }

  return `/list/${schemaName}?edit=1&schemaName=${schemaName}&name=${name}`;
}

const router = createRouter({ routes, history: createWebHistory() });

export default router;
