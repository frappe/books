<template>
  <div
    class="pt-6 pb-2 px-2 h-full block window-drag bg-gray-200 flex justify-between flex-col"
  >
    <div>
      <WindowControls class="px-3" />
      <div class="mt-6 px-3">
        <h6 class="text-sm font-semibold" @click="$router.push('/')">{{ companyName }}</h6>
      </div>
      <div class="mt-5">
        <div
          class="mt-1 first:mt-0"
          v-for="group in groups"
          :key="group.title"
          @click="onGroupClick(group)"
        >
          <div class="px-3 py-2 flex items-center rounded cursor-pointer hover:bg-white">
            <component :is="group.icon" class="w-5 h-5" :active="isActiveGroup(group) && !group.items" />
            <div
              class="ml-2 text-sm text-gray-900"
              :class="isActiveGroup(group) && !group.items && 'text-blue-500'"
            >
              {{ group.title }}
            </div>
          </div>
          <div v-if="group.items && isActiveGroup(group)">
            <div
              v-for="item in group.items"
              :key="item.label"
              class="mt-1 first:mt-0 text-sm text-gray-800 py-1 pl-10 rounded cursor-pointer hover:bg-white"
              :class="itemActiveClass(item)"
              @click="routeTo(item.route)"
            >{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <button
        class="block bg-white rounded w-full h-8 flex justify-center focus:outline-none focus:shadow-outline"
      >
        <AddIcon class="w-3 h-3 stroke-current text-gray-900" />
      </button>
    </div>
  </div>
</template>
<script>
import sidebarConfig from '../sidebarConfig';
import WindowControls from './WindowControls';
import AddIcon from './Icons/Add';
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
    AddIcon
  },
  async mounted() {
    this.companyName = await sidebarConfig.getTitle();
    this.groups = sidebarConfig.groups;
    this.activeGroup = this.groups.find(g => g.title === _('Sales'));
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
      if (group.route) {
        this.routeTo(group.route);
      }
      this.activeGroup = group;
    },
    routeTo(route) {
      this.activeGroup = null;
      this.$router.push(route);
    },
  }
};
</script>

