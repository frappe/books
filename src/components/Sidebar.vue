<template>
  <div
    class="p-2 h-full flex justify-between flex-col bg-gray-25"
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div>
      <!-- Company name and DB Switcher -->
      <div
        class="px-2 flex flex-row items-center justify-between mb-4"
        :class="platform === 'Mac' ? 'mt-10' : 'mt-2'"
      >
        <h6
          class="
            font-semibold
            whitespace-nowrap
            overflow-auto
            no-scrollbar
            select-none
          "
        >
          {{ companyName }}
        </h6>
      </div>

      <!-- Sidebar Items -->
      <div class="mt-1 first:mt-0" v-for="group in groups" :key="group.label">
        <div
          class="
            px-2
            py-2
            flex
            items-center
            rounded-md
            cursor-pointer
            hover:bg-gray-100
          "
          :class="isActiveGroup(group) && !group.items ? 'bg-gray-100' : ''"
          @click="onGroupClick(group)"
        >
          <Icon
            :name="group.icon"
            :size="group.iconSize || '18'"
            :height="group.iconHeight"
            :active="isActiveGroup(group)"
          />
          <div
            class="ml-2 text-lg text-gray-900"
            :class="isActiveGroup(group) && !group.items && 'text-blue-500'"
          >
            {{ group.label }}
          </div>
        </div>

        <!-- Expanded Group -->
        <div v-if="group.items && isActiveGroup(group)">
          <div
            v-for="item in group.items"
            :key="item.label"
            class="
              mt-1
              first:mt-0
              text-base text-gray-800
              py-1
              pl-10
              rounded
              cursor-pointer
              hover:bg-gray-100
            "
            :class="itemActiveClass(item)"
            @click="onItemClick(item)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- Report Issue and App Version -->
    <div class="window-no-drag flex flex-col gap-2 p-2">
      <button
        class="
          flex
          text-sm text-gray-600
          hover:text-gray-800
          gap-1
          items-center
        "
        @click="() => reportIssue()"
      >
        <feather-icon name="flag" class="h-4 w-4" />
        <p>
          {{ t`Report Issue` }}
        </p>
      </button>

      <button
        class="
          flex
          text-sm text-gray-600
          hover:text-gray-800
          gap-1
          items-center
        "
        @click="$emit('change-db-file')"
      >
        <feather-icon name="database" class="h-4 w-4" />
        <p>{{ t`Change DB` }}</p>
      </button>
      <p
        v-if="fyo.store.isDevelopment"
        class="text-xs text-gray-500 select-none"
      >
        dev mode
      </p>
    </div>
  </div>
</template>
<script>
import Button from 'src/components/Button.vue';
import { reportIssue } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { getSidebarConfig } from 'src/utils/sidebarConfig';
import { routeTo } from 'src/utils/ui';
import router from '../router';
import Icon from './Icon.vue';

export default {
  components: [Button],
  emits: ['change-db-file'],
  data() {
    return {
      companyName: '',
      groups: [],
      activeGroup: null,
    };
  },
  computed: {
    appVersion() {
      return fyo.store.appVersion;
    },
  },
  components: {
    Icon,
  },
  async mounted() {
    const { companyName } = await fyo.doc.getDoc('AccountingSettings');
    this.companyName = companyName;
    this.groups = getSidebarConfig();

    this.setActiveGroup();
    router.afterEach(() => {
      this.setActiveGroup();
    });
  },
  methods: {
    routeTo,
    reportIssue,
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute.value;
      const fallBackGroup = this.activeGroup;
      this.activeGroup = this.groups.find((g) => {
        if (fullPath.startsWith(g.route) && g.route !== '/') {
          return true;
        }

        if (g.route === fullPath) {
          return true;
        }

        if (g.items) {
          let activeItem = g.items.filter(
            ({ route }) => route === fullPath || fullPath.startsWith(route)
          );

          if (activeItem.length) {
            return true;
          }
        }
      });

      if (!this.activeGroup) {
        this.activeGroup = fallBackGroup || this.groups[0];
      }
    },
    itemActiveClass(item) {
      let { path: currentRoute, params } = this.$route;
      let routeMatch = currentRoute === item.route;
      let schemaNameMatch =
        item.schemaName && params.schemaName === item.schemaName;
      return routeMatch || schemaNameMatch ? 'bg-gray-100 text-blue-500' : '';
    },
    isActiveGroup(group) {
      return this.activeGroup && group.label === this.activeGroup.label;
    },
    onGroupClick(group) {
      if (group.action) {
        group.action();
      }

      if (group.route) {
        routeTo(group.route);
      }
    },
    onItemClick(item) {
      if (item.action) {
        item.action();
      }
      if (item.route) {
        routeTo(item.route);
      }
    },
  },
};
</script>
