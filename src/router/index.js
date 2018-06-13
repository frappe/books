import Vue from 'vue'
import Router from 'vue-router'
import ListAndForm from '@/components/ListAndForm'
import SetupWizard from '@/pages/SetupWizard/SetupWizard'
import Calendar from '@/components/Calendar'

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
      path: '/calendar/:doctype',
      name: 'Calendar',
      component: Calendar,
      props: true
    }
    // {
    //   path: '/tree/:doctype',
    //   name: '',
    //   component: ''
    // },
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
