import Vue from 'vue'
import Router from 'vue-router'
import ListAndForm from '@/components/ListAndForm'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/list/:doctype',
      name: 'List',
      component: ListAndForm
    },
    {
      path: '/edit/:doctype/:name',
      name: 'Form',
      component: ListAndForm
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
