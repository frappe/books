<template>
  <div id="app">
    <div class="row no-gutters" v-if="showDesk">
      <sidebar class="col-2" />
      <div class="page-container col-10 bg-light">
        <router-view />
      </div>
    </div>
    <setup-wizard v-else/>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar';
import frappe from 'frappejs';
import Vue from 'vue';
import Observable from 'frappejs/utils/observable';
import Desk from 'frappejs/ui/components/Desk';
import sidebarConfig from './sidebarConfig';
import SetupWizard from './pages/SetupWizard/SetupWizard';

export default {
  name: 'App',
  data() {
    return {
      showDesk: JSON.parse(localStorage.showDesk),
      sidebarConfig
    }
  },
  components: {
    SetupWizard,
    Sidebar
  },
  async created() {
    frappe.events.on('show-setup-wizard', () => {
      this.showDesk = false;
    })

    frappe.events.on('show-desk', () => {
      this.showDesk = true;
      this.$router.push('/tree/Account');
    });
  }
}
</script>
<style lang="scss">
@import "styles/index.scss";
</style>
