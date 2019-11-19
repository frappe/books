<template>
  <div
    class="pt-6 pb-2 px-2 h-full block window-drag flex justify-between flex-col"
    style="background-color: rgba(255, 255, 255, 0.6)"
  >
    <div>
      <WindowControls class="px-3" :buttons="['close', 'minimize']" />
      <div class="mt-6 px-3">
        <h6 class="text-base font-semibold" @click="$router.push('/')">{{ companyName }}</h6>
      </div>
      <div class="mt-5">
        <div class="mt-1 first:mt-0" v-for="group in groups" :key="group.title">
          <div
            class="px-3 py-2 flex items-center rounded cursor-pointer hover:bg-white"
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
            >{{ group.title }}</div>
          </div>
          <div v-if="group.items && isActiveGroup(group)">
            <div
              v-for="item in group.items"
              :key="item.label"
              class="mt-1 first:mt-0 text-base text-gray-800 py-1 pl-10 rounded cursor-pointer hover:bg-white"
              :class="itemActiveClass(item)"
              @click="routeTo(item.route)"
            >{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import sidebarConfig from '../sidebarConfig';
import WindowControls from './WindowControls';
import { _ } from 'frappejs/utils';

export default {
  data() {
    return {
      companyName: '',
      groups: [],
      activeGroup: null
    };
  },
  components: {
    WindowControls,
  },
  async mounted() {
    this.companyName = await sidebarConfig.getTitle();
    this.groups = sidebarConfig.groups;

    let currentPath = this.$router.currentRoute.fullPath;
    this.activeGroup = this.groups.find(g => {
      if (g.items) {
        let activeItem = g.items.filter(i => i.route === currentPath);
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
    itemActiveClass(item) {
      let currentRoute = this.$route.path;
      return currentRoute === item.route ? 'bg-white text-blue-500' : '';
    },
    isActiveGroup(group) {
      return this.activeGroup && group.title === this.activeGroup.title;
    },
    onGroupClick(group) {
      if (group.action) {
        group.action();
      }
      if (group.route) {
        this.routeTo(group.route);
      }
      this.activeGroup = group;
    },
    routeTo(route) {
      this.$router.push(route);
    }
  }
};
</script>

