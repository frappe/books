<template>
  <div
    class="
      pt-6
      pb-2
      px-2
      h-full
      block
      flex
      justify-between
      flex-col
      bg-gray-100
    "
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="window-no-drag">
      <WindowControls v-if="platform === 'Mac'" class="px-3 mb-6" />
      <div class="px-3">
        <h6 class="text-lg font-semibold" @click="routeTo('/')">
          {{ companyName }}
        </h6>
      </div>
      <div class="mt-3">
        <div class="mt-1 first:mt-0" v-for="group in groups" :key="group.title">
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
            <component
              :is="group.icon"
              class="w-5 h-5"
              :active="isActiveGroup(group)"
            />
            <div
              class="ml-2 text-lg text-gray-900"
              :class="isActiveGroup(group) && !group.items && 'text-blue-500'"
            >
              {{ group.title }}
            </div>
          </div>
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
    </div>
    <div class="px-5 window-no-drag">
      <button
        class="pb-1 text-sm text-gray-600 hover:text-gray-800 w-full whitespace-nowrap overflow-scroll no-scrollbar text-left"
        @click="$emit('change-db-file')"
      >
        {{ dbPath }}
      </button>
      <p class="pb-3 text-sm text-gray-600">v{{ appVersion }}</p>
    </div>
  </div>
</template>
<script>
import sidebarConfig from '../sidebarConfig';
import Button from '@/components/Button';
import WindowControls from './WindowControls';
import { routeTo } from '@/utils';
import path from 'path';
import router from '../router';

export default {
  components: [Button],
  data() {
    return {
      companyName: '',
      groups: [],
      activeGroup: null,
    };
  },
  computed: {
    appVersion() {
      return frappe.store.appVersion;
    },
    dbPath() {
      const splits = frappe.db.dbPath.split(path.sep);
      return path.join(...splits.slice(splits.length - 2));
    },
  },
  components: {
    WindowControls,
  },
  async mounted() {
    this.companyName = await sidebarConfig.getTitle();
    let groups = sidebarConfig.getGroups();
    groups = groups.filter((group) => {
      if (
        group.route === '/get-started' &&
        frappe.SystemSettings.hideGetStarted
      ) {
        return false;
      }
      return true;
    });

    // use the hidden property in the routes config to show/hide the elements
    // filter doens't work with async function so using reduce
    for (let group of groups) {
      if (group.items) {
        group.items = await group.items.reduce(async (acc, item) => {
          if (item.hidden) {
            // async methods can also be used in future
            const hidden = item.hidden();
            if (hidden) {
              return acc;
            } else {
              return (await acc).concat(item);
            }
          }

          return (await acc).concat(item);
        }, []);
      }
    }


    this.groups = groups;

    this.setActiveGroup();
    router.afterEach(() => {
      this.setActiveGroup();
    });
  },
  methods: {
    routeTo,
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute;
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
      return this.activeGroup && group.title === this.activeGroup.title;
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
