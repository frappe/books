<template>
  <div id="app">
    <frappe-desk v-if="showDesk" :sidebarConfig="sidebarConfig">
      <router-view />
    </frappe-desk>
    <setup-wizard v-else/>
  </div>
</template>

<script>
import Vue from 'vue';
import Observable from 'frappejs/utils/observable';
import Desk from 'frappejs/ui/components/Desk';
import sidebarConfig from './sidebarConfig';
import SetupWizard from './pages/SetupWizard/SetupWizard';

export default {
  name: 'App',
  data() {
    return {
      showDesk: true,
      sidebarConfig
    }
  },
  components: {
    FrappeDesk: Desk,
    SetupWizard
  },
  async created() {
    const accountingSettings = await frappe.getSingle('AccountingSettings');
    if (accountingSettings.companyName) {
      this.showDesk = true;
    } else {
      this.showDesk = false;
    }

    frappe.events.on('setup-complete', () => {
      this.showDesk = true;
      this.$router.push('/tree/Account');
    });
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
