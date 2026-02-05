import ChartOfAccounts from 'src/pages/ChartOfAccounts.vue';
import CommonForm from 'src/pages/CommonForm/CommonForm.vue';
import Dashboard from 'src/pages/Dashboard/Dashboard.vue';
import GetStarted from 'src/pages/GetStarted.vue';
import ImportWizard from 'src/pages/ImportWizard.vue';
import ListView from 'src/pages/ListView/ListView.vue';
import PrintView from 'src/pages/PrintView/PrintView.vue';
import ReportPrintView from 'src/pages/PrintView/ReportPrintView.vue';
import QuickEditForm from 'src/pages/QuickEditForm.vue';
import Report from 'src/pages/Report.vue';
import Settings from 'src/pages/Settings/Settings.vue';
import TemplateBuilder from 'src/pages/TemplateBuilder/TemplateBuilder.vue';
import CustomizeForm from 'src/pages/CustomizeForm/CustomizeForm.vue';
import POS from 'src/pages/POS/POS.vue';
import Login from '../custom/src/pages/Login.vue';
import License from 'src/pages/License.vue';
import PaymentMethods from 'src/pages/PaymentMethods.vue';
import type { HistoryState } from 'vue-router';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { historyState } from './utils/refs';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/',
    component: Dashboard,
  },
  {
    path: '/get-started',
    component: GetStarted,
  },
  {
    path: `/edit/:schemaName/:name`,
    name: `CommonForm`,
    components: {
      default: CommonForm,
      edit: QuickEditForm,
    },
    props: {
      default: (route) => ({
        schemaName: route.params.schemaName,
        name: route.params.name,
      }),
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
      edit: (route) => route.query,
    },
  },
  {
    path: '/print/:schemaName/:name',
    name: 'PrintView',
    component: PrintView,
    props: true,
  },
  {
    path: '/report-print/:reportName',
    name: 'ReportPrintView',
    component: ReportPrintView,
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
    path: '/customize-form',
    name: 'Customize Form',
    component: CustomizeForm,
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
  {
    path: '/license',
    name: 'License',
    component: License,
  },
  {
    path: '/payment-methods',
    name: 'Payment Methods',
    component: PaymentMethods,
  },
  {
    path: '/pos',
    name: 'Point of Sale',
    components: {
      default: POS,
      edit: QuickEditForm,
    },
    props: {
      default: true,
      edit: (route) => route.query,
    },
  },
];

const router = createRouter({ routes, history: createWebHistory() });

router.beforeEach(async (to, from, next) => {
  const sessionToken = localStorage.getItem('session_token');
  
  // Check authentication first
  if (to.path !== '/login' && !sessionToken) {
    next('/login');
    return;
  } else if (to.path === '/login' && sessionToken) {
    next('/');
    return;
  }
  
  // Check license for authenticated users
  // Allow access to /login and /license without license check
  if (to.path !== '/login' && to.path !== '/license') {
    try {
      // Check license validity via IPC
      const licenseState = await (window as any).ipc.invoke('get-license-state');
      
      // Block access if no valid license
      if (!licenseState || !licenseState.isValid) {
        next('/license');
        return;
      }
    } catch (error) {
      console.error('License check failed:', error);
      // On error, redirect to license page to be safe
      next('/license');
      return;
    }
  }
  
  next();
});

router.afterEach(({ fullPath }) => {
  const state = history.state as HistoryState;
  historyState.forward = !!state.forward;
  historyState.back = !!state.back;

  if (fullPath.includes('index.html')) {
    return;
  }

  localStorage.setItem('lastRoute', fullPath);
});

export default router;
