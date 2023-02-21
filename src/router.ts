import { ModelNameEnum } from 'models/types';
import ChartOfAccounts from 'src/pages/ChartOfAccounts.vue';
import CommonForm from 'src/pages/CommonForm/CommonForm.vue';
import Dashboard from 'src/pages/Dashboard/Dashboard.vue';
import GeneralForm from 'src/pages/GeneralForm.vue';
import GetStarted from 'src/pages/GetStarted.vue';
import ImportWizard from 'src/pages/ImportWizard.vue';
import InvoiceForm from 'src/pages/InvoiceForm.vue';
import ListView from 'src/pages/ListView/ListView.vue';
import PrintView from 'src/pages/PrintView/PrintView.vue';
import QuickEditForm from 'src/pages/QuickEditForm.vue';
import Report from 'src/pages/Report.vue';
import Settings from 'src/pages/Settings/Settings.vue';
import {
  createRouter,
  createWebHistory,
  RouteLocationRaw,
  RouteRecordRaw
} from 'vue-router';

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

function getCommonFormItems(): RouteRecordRaw[] {
  return [
    ModelNameEnum.JournalEntry,
    ModelNameEnum.Payment,
    ModelNameEnum.StockMovement,
    ModelNameEnum.Item,
  ].map((schemaName) => {
    return {
      path: `/edit/${schemaName}/:name`,
      name: `${schemaName}Form`,
      components: {
        default: CommonForm,
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
  });
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
  ...getCommonFormItems(),
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
    path: '/import-wizard',
    name: 'Import Wizard',
    component: ImportWizard,
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

export function getCreateRoute(
  schemaName: string,
  name: string
): RouteLocationRaw {
  if (
    [
      ModelNameEnum.SalesInvoice,
      ModelNameEnum.PurchaseInvoice,
      ModelNameEnum.JournalEntry,
      ModelNameEnum.Shipment,
      ModelNameEnum.PurchaseReceipt,
      ModelNameEnum.StockMovement,
      ModelNameEnum.Payment,
      ModelNameEnum.Item,
    ].includes(schemaName as ModelNameEnum)
  ) {
    return `/edit/${schemaName}/${name}`;
  }

  return `/list/${schemaName}?edit=1&schemaName=${schemaName}&name=${name}`;
}

const router = createRouter({ routes, history: createWebHistory() });

export default router;
