<template>
  <div
    class="pt-6 pb-2 px-2 h-full flex justify-between flex-col bg-gray-100"
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="window-no-drag">
      <WindowControls v-if="platform === 'Mac'" class="px-3 mb-6" />
      <!-- Company name and DB Switcher -->
      <div class="px-3 flex flex-row items-center justify-between mb-6">
        <h6
          class="
            text-xl
            font-semibold
            whitespace-nowrap
            overflow-scroll
            no-scrollbar
            w-32
          "
        >
          {{ companyName }}
        </h6>
        <feather-icon
          class="
            w-5
            h-5
            ml-1
            stroke-2
            cursor-pointer
            text-gray-600
            hover:text-gray-800
          "
          name="chevron-down"
          @click="$emit('change-db-file')"
        />
      </div>

      <!-- Sidebar Items -->
      <div class="mt-1 first:mt-0" v-for="group in groups" :key="group.label">
        <div
          class="
            px-3
            py-2
            flex
            items-center
            rounded-lg
            cursor-pointer
            hover:bg-white
          "
          :class="isActiveGroup(group) && !group.items ? 'bg-white' : ''"
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
              hover:bg-white
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
    <div class="px-5 window-no-drag">
      <button
        class="pb-1 text-sm text-gray-600 hover:text-gray-800 w-full text-left"
        @click="() => reportIssue()"
      >
        {{ t`Report Issue` }}
      </button>
      <p class="pb-3 text-sm text-gray-600">v{{ appVersion }}</p>
    </div>
  </div>
</template>
<script>
import path from 'path';
import Button from 'src/components/Button.vue';
import { reportIssue } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { getSidebarConfig } from 'src/utils/sidebarConfig';
import { routeTo } from 'src/utils/ui';
import router from '../router';
import Icon from './Icon.vue';
import WindowControls from './WindowControls.vue';

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
    dbPath() {
      const splits = fyo.db.dbPath.split(path.sep);
      return path.join(...splits.slice(splits.length - 2));
    },
  },
  components: {
    WindowControls,
    Icon,
  },
  async mounted() {
    const { companyName } = await fyo.doc.getSingle('AccountingSettings');
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
      let doctypeMatch = item.doctype && params.doctype === item.doctype;
      return routeMatch || doctypeMatch ? 'bg-white text-blue-500' : '';
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
