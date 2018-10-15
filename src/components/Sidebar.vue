<template>
  <div class="page-sidebar bg-dark p-2 text-light">
    <div class="company-name px-3 py-2 my-2">
      <h6 class="m-0">{{ companyName }}</h6>
    </div>
    <div :class="['sidebar-item px-3 py-2 ', isCurrentRoute(item.route) ? 'active' : '']" @click="routeTo(item.route)" v-for="item in items" :key="item.label">
      {{ item.label }}
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      companyName: '',
      items: [
        {
          label: 'Invoices',
          route: '/list/Invoice'
        },
        {
          label: 'Customers',
          route: '/list/Party'
        },
        {
          label: 'Items',
          route: '/list/Item'
        },
        {
          label: 'Reports',
          route: '/reports'
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
  },
  methods: {
    isCurrentRoute(route) {
      return this.$route.path === route;
    },
    routeTo(route) {
      this.$router.push(route);
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
