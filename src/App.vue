<template>
  <div id="app">
    <frappe-desk v-if="showDesk">
      <router-view />
    </frappe-desk>
    <router-view v-else name="setup" />
  </div>
</template>

<script>
import Desk from '@/components/Desk';

export default {
  name: 'App',
  data() {
    return {
      showDesk: true
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
}
</script>

<style lang="scss">
@import "~bootstrap/scss/bootstrap";

html {
  font-size: 14px;
}

</style>
