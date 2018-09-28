/**
 * Vue Plugin that registers common UI elements
 * like Button and Modal into the root Vue instance
 */

import frappe from 'frappejs';
import NotFound from '../components/NotFound';
import FeatherIcon from '../components/FeatherIcon';
import FrappeControl from '../components/controls/FrappeControl';
import Button from '../components/Button';
import Indicator from '../components/Indicator';
import modalPlugin from '../components/Modal/plugin';
import formModalPlugin from '../plugins/formModal';
import outsideClickDirective from './outsideClickDirective';

export default function installFrappePlugin(Vue) {
  Vue.component('not-found', NotFound);
  Vue.component('feather-icon', FeatherIcon);
  Vue.component('frappe-control', FrappeControl);
  Vue.component('f-button', Button);
  Vue.component('indicator', Indicator);
  Vue.directive('on-outside-click', outsideClickDirective);

  Vue.use(modalPlugin);
  Vue.use(formModalPlugin);

  Vue.mixin({
    computed: {
      frappe() {
        return frappe;
      }
    },
    methods: {
      // global translation function in every component
      _(...args) {
        return frappe._(...args);
      }
    }
  });
}
