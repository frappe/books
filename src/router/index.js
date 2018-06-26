import Vue from 'vue'
import Router from 'vue-router'
import ListAndForm from '@/pages/ListAndForm'
import SetupWizard from '@/pages/SetupWizard/SetupWizard'
import POS from '@/components/pos/POS'
import Report from '@/components/Report'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/list/:doctype',
      name: 'List',
      component: ListAndForm,
      props: true
    },
    {
      path: '/edit/:doctype/:name',
      name: 'Form',
      component: ListAndForm,
      props: true
    },
    {
      path: '/setup-wizard',
      name: 'SetupWizard',
      components: {
        setup: SetupWizard
      }
    },
    {
      path: '/pos/',
      name: 'POS',
      component: POS
    },
    {
      path: '/report/:reportName',
      name: 'Report',
      component: Report,
      props: true
    }
    // {
    //   path: '/table/:doctype',
    //   name: '',
    //   component: ''
    // },
    // {
    //   path: '/print/:doctype/:name',
    //   name: '',
    //   component: ''
    // },
    // {
    //   path: '/new/:doctype',
    //   name: '',
    //   component: ''
    // }
  ]
})
