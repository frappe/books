<template>
  <div id="app">
    <frappe-desk v-if="showDesk" :sidebarConfig="sidebarConfig">
      <router-view />
    </frappe-desk>
    <router-view v-else name="setup" />
  </div>
</template>
<script>
import Vue from 'vue';
import Observable from 'frappejs/utils/observable';
import Desk from 'frappejs/ui/components/Desk';
import sidebarConfig from './sidebarConfig';
import emailConfig from './emailConfig';

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
    FrappeDesk: Desk
  },
  async beforeRouteUpdate(to, from, next) {
    const accountingSettings = await frappe.getSingle('AccountingSettings');
    if (accountingSettings.companyName) {
      this.showDesk = true;
    } else {
      this.showDesk = true;
    }
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