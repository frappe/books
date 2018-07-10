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
  },
  async beforeRouteUpdate(to, from, next) {
    const accountingSettings = await frappe.getSingle('AccountingSettings');
    if (accountingSettings.companyName) {
      this.showDesk = true;
    } else {
      this.showDesk = true;
    }
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
