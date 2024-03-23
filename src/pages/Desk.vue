<script setup lang="ts">
import { showSidebar } from 'src/utils/refs';
import { toggleSidebar } from 'src/utils/ui';
</script>
<template>
  <div class="flex overflow-hidden">
    <Transition name="sidebar">
      <!-- eslint-disable vue/require-explicit-emits -->
      <Sidebar
        v-show="showSidebar"
        class="flex-shrink-0 border-e dark:border-gray-800 whitespace-nowrap w-sidebar"
        :darkMode="darkMode"
        @change-db-file="$emit('change-db-file')"
        @toggle-darkmode="$emit('toggle-darkmode')"
      />
    </Transition>

    <div class="flex flex-1 overflow-y-hidden bg-white dark:bg-gray-875">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component
            :is="Component"
            :key="$route.path"
            :darkMode="darkMode"
            class="flex-1"
          />
        </keep-alive>
      </router-view>

      <router-view v-slot="{ Component, route }" name="edit">
        <Transition name="quickedit">
          <div v-if="route?.query?.edit">
            <component
              :is="Component"
              :key="route.query.schemaName + route.query.name"
              :darkMode="darkMode"
            />
          </div>
        </Transition>
      </router-view>
    </div>

    <!-- Show Sidebar Button -->
    <button
      v-show="!showSidebar"
      class="absolute bottom-0 start-0 text-gray-600 bg-gray-100 rounded rtl-rotate-180 p-1 m-4 opacity-0 hover:opacity-100 hover:shadow-md"
      @click="() => toggleSidebar()"
    >
      <feather-icon name="chevrons-right" class="w-4 h-4" />
    </button>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import Sidebar from '../components/Sidebar.vue';
export default defineComponent({
  name: 'Desk',
  components: {
    Sidebar,
  },
  props: {
    darkMode: Boolean,
  },
  emits: ['change-db-file', 'toggle-darkmode'],
});
</script>

<style scoped>
.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  transform: translateX(calc(-1 * var(--w-sidebar)));
  width: 0px;
}
[dir='rtl'] .sidebar-leave-to {
  opacity: 0;
  transform: translateX(calc(1 * var(--w-sidebar)));
  width: 0px;
}

.sidebar-enter-to,
.sidebar-leave-from {
  opacity: 1;
  transform: translateX(0px);
  width: var(--w-sidebar);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 150ms ease-out;
}
</style>
