<template>
  <div class="page-sidebar bg-dark p-2 text-light d-flex flex-column justify-content-between">
    <div>
      <div class="company-name px-3 py-2 my-2">
        <h6 class="m-0">{{ companyName }}</h6>
      </div>
      <div :class="['sidebar-item px-3 py-2 ', isCurrentRoute(item.route) ? 'active' : '']" @click="routeTo(item.route)" v-for="item in items" :key="item.label">
        {{ item.label }}
      </div>
    </div>
    <div class="sidebar-item px-3 py-2 d-flex align-items-center"
      v-if="dbFileName" @click="goToDatabaseSelector"
    >
      <feather-icon class="mr-2" name="settings"></feather-icon>
      <span>{{ dbFileName }}</span>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      companyName: '',
      dbFileName: '',
      items: [
        {
          label: 'Chart of Accounts',
          route: '/tree/Account'
        },
        {
          label: 'Customers',
          route: '/list/Customer'
        },
        {
          label: 'Items',
          route: '/list/Item'
        },
        {
          label: 'Invoices',
          route: '/list/Invoice'
        },
        {
          label: 'Reports',
          route: '/reportList'
        },
        {
          label: 'Settings',
          route: '/settings'
        },
      ]
    }
  },
  async mounted() {
    const accountingSettings = await frappe.getDoc('AccountingSettings');
    this.companyName = accountingSettings.companyName;
    if (localStorage.dbPath) {
      const parts = localStorage.dbPath.split('/');
      this.dbFileName = parts[parts.length - 1];
    }
  },
  methods: {
    isCurrentRoute(route) {
      return this.$route.path === route;
    },
    routeTo(route) {
      this.$router.push(route);
    },
    goToDatabaseSelector() {
      localStorage.dbPath = '';
      window.location.reload();
    }
  }
}
</script>

<style lang="scss">
@import "../styles/variables.scss";

.page-sidebar {
  height: 100vh;
}

.sidebar-item {
  cursor: pointer;
  border-radius: $border-radius;

  &:hover {
    color: $gray-300;
  }

  &.active {
    color: $white;
    background-color: $primary;
  }
}
</style>
