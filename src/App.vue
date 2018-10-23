<template>
  <div id="app">
    <frappe-desk v-if="showDesk" :sidebarConfig="sidebarConfig">
      <router-view />
    </frappe-desk>
    <setup-wizard v-else/>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Vue from 'vue';
import Observable from 'frappejs/utils/observable';
import Desk from 'frappejs/ui/components/Desk';
import sidebarConfig from './sidebarConfig';
import emailConfig from './emailConfig';
import SetupWizard from './pages/SetupWizard/SetupWizard';

export default {
  name: 'App',
  data() {
    return {
      showDesk: true,
      sidebarConfig: sidebarConfig
    };
  },
  watch: {
    $route(data) {
      // temporary TODO: replace with better option
      if (data.path.match(/email/i)) {
        this.sidebarConfig = emailConfig;
      } else {
        this.sidebarConfig = sidebarConfig;
      }
    }
  },
  components: {
    FrappeDesk: Desk,
    SetupWizard
  },
  async created() {
    frappe.events.on('show-setup-wizard', () => {
      this.showDesk = false;
    });

    frappe.events.on('show-desk', () => {
      this.showDesk = true;
      this.$router.push('/tree/Account');
    });
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/bootstrap';
@import '~frappe-datatable/dist/frappe-datatable';

html {
  font-size: 14px;
}
</style>
