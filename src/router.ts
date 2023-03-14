import { ModelNameEnum } from 'models/types';
import ChartOfAccounts from 'src/pages/ChartOfAccounts.vue';
import CommonForm from 'src/pages/CommonForm/CommonForm.vue';
import Dashboard from 'src/pages/Dashboard/Dashboard.vue';
import GetStarted from 'src/pages/GetStarted.vue';
import ImportWizard from 'src/pages/ImportWizard.vue';
import InvoiceForm from 'src/pages/InvoiceForm.vue';
import ListView from 'src/pages/ListView/ListView.vue';
import PrintView from 'src/pages/PrintView/PrintView.vue';
import QuickEditForm from 'src/pages/QuickEditForm.vue';
import Report from 'src/pages/Report.vue';
import Settings from 'src/pages/Settings/Settings.vue';
import TemplateBuilder from 'src/pages/TemplateBuilder/TemplateBuilder.vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

function getCommonFormItems(): RouteRecordRaw[] {
  return [
    ModelNameEnum.Shipment,
    ModelNameEnum.PurchaseReceipt,
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
    path: '/template-builder/:name',
    name: 'Template Builder',
    component: TemplateBuilder,
    props: true,
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

const router = createRouter({ routes, history: createWebHistory() });

export default router;
