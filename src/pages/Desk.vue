<template>
  <div class="flex overflow-hidden">
    <Transition name="sidebar">
      <Sidebar
        v-show="sidebar"
        class="flex-shrink-0 border-r whitespace-nowrap"
        :class="sidebar ? 'w-sidebar' : ''"
        @change-db-file="$emit('change-db-file')"
        @toggle-sidebar="sidebar = !sidebar"
      />
    </Transition>

    <div class="flex flex-1 overflow-y-hidden bg-white">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" class="flex-1" :key="$route.path" />
        </keep-alive>
      </router-view>

      <div class="flex" v-if="showQuickEdit">
        <router-view name="edit" v-slot="{ Component }">
          <keep-alive>
            <component
              :is="Component"
              class="w-quick-edit flex-1"
              :key="$route.query.schemaName + $route.query.name"
            />
          </keep-alive>
        </router-view>
      </div>
    </div>

    <!-- Show Sidebar Button -->
    <button
      v-show="!sidebar"
      class="
        absolute
        bottom-0
        left-0
        text-gray-600
        bg-gray-100
        rounded
        p-1
        m-4
        opacity-0
        hover:opacity-100
        hover:shadow-md
      "
      @click="sidebar = !sidebar"
    >
      <feather-icon name="chevrons-right" class="w-5 h-5" />
    </button>
  </div>
</template>
<script>
import { computed } from '@vue/reactivity';
import Sidebar from '../components/Sidebar';
export default {
  name: 'Desk',
  emits: ['change-db-file'],
  data() {
    return { sidebar: true };
  },
  provide() {
    return { sidebar: computed(() => this.sidebar) };
  },
  components: {
    Sidebar,
  },
  computed: {
    showQuickEdit() {
      return (
        this.$route.query.edit &&
        this.$route.query.schemaName &&
        this.$route.query.name
      );
    },
  },
};
</script>

<style scoped>
.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  width: 0px;
}

.sidebar-enter-to,
.sidebar-leave-from {
  opacity: 1;
  width: var(--w-sidebar);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 250ms ease-out;
}
</style>
