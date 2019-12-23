import Vue from 'vue';
import Router from 'vue-router';

// standard views
import Dashboard from '@/pages/Dashboard/Dashboard';
import ListView from '@/pages/ListView/ListView';
import PrintView from '@/pages/PrintView/PrintView';
import QuickEditForm from '@/pages/QuickEditForm';
import Report from '@/pages/Report';

// custom views
import GetStarted from '@/pages/GetStarted';
import ChartOfAccounts from '@/pages/ChartOfAccounts';
import InvoiceForm from '@/pages/InvoiceForm';
import JournalEntryForm from '@/pages/JournalEntryForm';

Vue.use(Router);

const routes = [
  {
    path: '/',
    component: Dashboard
  },
  {
    path: '/get-started',
    component: GetStarted
  },
  {
    path: '/edit/JournalEntry/:name',
    name: 'JournalEntryForm',
    components: {
      default: JournalEntryForm,
      edit: QuickEditForm
    },
    props: {
      default: route => {
        // for sidebar item active state
        route.params.doctype = 'JournalEntry';
        return {
          doctype: 'JournalEntry',
          name: route.params.name
        };
      },
      edit: route => route.query
    }
  },
  {
    path: '/edit/:doctype/:name',
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
        const { doctype, filters } = route.params;
        return {
          doctype,
          filters
        };
      },
      edit: route => route.query
    }
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
    props: true
  },
  {
    path: '/chart-of-accounts',
    name: 'Chart Of Accounts',
    components: {
      default: ChartOfAccounts,
      edit: QuickEditForm
    },
    props: {
      default: true,
      edit: route => route.query
    }
  }
];

let router = new Router({ routes });

if (process.env.NODE_ENV === 'development') {
  window.router = router;
}

export default router;
