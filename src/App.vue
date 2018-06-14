<template>
  <div id="app">
    <frappe-desk v-if="showDesk">
      <router-view />
    </frappe-desk>
    <router-view v-else name="setup" />
    <frappe-modal ref="modal" :show="showModal" v-bind="modalOptions" />
  </div>
</template>

<script>
import Vue from 'vue';
import Observable from 'frappejs/utils/observable';
import Desk from '@/components/Desk';
import Modal from '@/components/Modal';

const Bus = new Observable();

Vue.use({
  // enable use of this.$modal in every component
  // this also keeps only one modal in the DOM at any time
  // which is the recommended way by bootstrap
  install (Vue) {
    Vue.prototype.$modal = {
      show(options) {
        Bus.trigger('showModal', options);
      },

      hide() {
        Bus.trigger('hideModal');
      }
    }
  }
});

export default {
  name: 'App',
  data() {
    return {
      showDesk: true,
      showModal: false,
      modalOptions: {}
    }
  },
  components: {
    FrappeDesk: Desk,
    FrappeModal: Modal
  },
  async beforeRouteUpdate(to, from, next) {
    const accountingSettings = await frappe.getSingle('AccountingSettings');
    if (accountingSettings.companyName) {
      this.showDesk = true;
    } else {
      this.showDesk = true;
    }
  },
  mounted() {
    Bus.on('showModal', (options = {}) => {
      this.showModal = true;
      this.modalOptions = options;
    });

    Bus.on('hideModal', () => {
      this.showModal = false;
    });

    window.frappeModal = this.$modal;
  }
}
</script>

<style lang="scss">
@import "~bootstrap/scss/bootstrap";
@import '~frappe-datatable/dist/frappe-datatable';

html {
  font-size: 14px;
}

</style>
