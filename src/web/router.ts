/**
 * Web-only router. Deliberately separate from src/router.ts: that router
 * (and everything it imports — ChartOfAccounts, POS, Settings, etc.)
 * assumes an already-connected company database, which on Web doesn't
 * exist until feature 0002 (tenant schema & data layer). This feature's
 * scope is sign-in through an empty dashboard shell only.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import SignIn from 'src/pages/web/SignIn.vue';
import SignUp from 'src/pages/web/SignUp.vue';
import CreateOrganization from 'src/pages/web/CreateOrganization.vue';
import Dashboard from 'src/pages/web/Dashboard.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/sign-in/:pathMatch(.*)*', component: SignIn },
  { path: '/sign-up/:pathMatch(.*)*', component: SignUp },
  { path: '/create-organization', component: CreateOrganization },
  { path: '/dashboard', component: Dashboard },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
