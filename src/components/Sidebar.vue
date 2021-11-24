<template>
  <div
    class="
      pt-6
      pb-2
      px-2
      h-full
      block
      window-drag
      flex
      justify-between
      flex-col
      bg-gray-100
    "
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
    <div class="px-5">
      <button
        class="pb-1 text-sm text-gray-600 hover:text-gray-800 truncate"
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
    this.groups = sidebarConfig.groups;

    let currentPath = this.$router.currentRoute.fullPath;
    this.activeGroup = this.groups.find((g) => {
      if (g.route === currentPath) {
        return true;
      }
      if (g.items) {
        let activeItem = g.items.filter((i) => i.route === currentPath);
        if (activeItem.length) {
          return true;
        }
      }
    });
    if (!this.activeGroup) {
      this.activeGroup = this.groups[0];
    }
  },
  methods: {
    routeTo,
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
      this.activeGroup = group;
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
