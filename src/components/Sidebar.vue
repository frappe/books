<template>
  <div class="page-sidebar bg-dark p-2 text-light d-flex flex-column justify-content-between">
    <div>
      <div class="company-name px-3 py-2 my-2">
        <h6 class="m-0">{{ companyName }}</h6>
      </div>
      <div>
        <!-- <transition-group name="slide-fade-group"> -->
        <div v-for="group in groups" :key="group">
          <div
            :class="['sidebar-item px-3 py-2 ', activeGroup === group ? 'active' : '']"
            @click="toggleGroup(group)"
            style="user-select: none;"
          >
            {{
            group }}
          </div>
          <transition name="slide-fade">
            <div v-if="openGroup === group">
              <div
                v-for="item in groupItems"
                style="user-select: none;"
                :class="['sidebar-item px-3 py-2 ', isCurrentRoute(item.route) ? 'active' : '']"
                @click="routeTo(item.route)"
                :key="item.label"
              >
                <div class="d-flex align-items-center">
                  <feather-icon class="mr-1" name="chevron-right" />
                  {{ item.label }}
                </div>
              </div>
            </div>
          </transition>
        </div>
        <!-- </transition-group> -->
      </div>
    </div>
    <div
      class="sidebar-item px-3 py-2 d-flex align-items-center"
      v-if="dbFileName"
      @click="goToDatabaseSelector"
    >
      <feather-icon class="mr-2" name="settings"></feather-icon>
      <span>{{ dbFileName }}</span>
    </div>
  </div>
</template>
<script>
import sidebarConfig from '../sidebarConfig';
export default {
  data() {
    return {
      companyName: '',
      dbFileName: '',
      groups: [],
      groupItems: [],
      activeGroup: undefined,
      openGroup: undefined,
      items: [
        {
          label: 'Chart of Accounts',
          route: '/chartOfAccounts'
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
          label: 'Tax',
          route: '/list/Tax'
        },
        {
          label: 'Payments',
          route: '/list/Payment'
        },
        {
          label: 'Journal Entry',
          route: '/list/JournalEntry'
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
        }
      ]
    };
  },
  async mounted() {
    this.companyName = await sidebarConfig.getTitle();
    this.dbFileName = await sidebarConfig.getDbName();
    this.groups = sidebarConfig.getGroups();
  },
  methods: {
    isCurrentRoute(route) {
      if (this.activeGroup) return false;
      return this.$route.path === route;
    },
    toggleGroup(groupTitle) {
      this.groupItems =
        this.activeGroup === groupTitle
          ? []
          : sidebarConfig.getItems(groupTitle);
      this.activeGroup =
        this.activeGroup === groupTitle ? undefined : groupTitle;
      this.openGroup = this.activeGroup === groupTitle ? groupTitle : undefined;
    },
    routeTo(route) {
      this.activeGroup = undefined;
      this.$router.push(route);
    },
    goToDatabaseSelector() {
      localStorage.dbPath = '';
      window.location.reload();
    }
  }
};
</script>

<style lang="scss">
@import '../styles/variables.scss';

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
.slide-fade-enter-active {
  transition: all 0.2s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(-5px);
  opacity: 0;
}
// .slide-fade-group-enter-active {
//   transition: all 0.5s ease;
// }
// .slide-fade-group-leave-active {
//   transition: all 0.5s ease-out;
// }
// .slide-fade-group-enter,
// .slide-fade-group-leave-to {
//   transform: translateY(-10px);
// }
</style>
