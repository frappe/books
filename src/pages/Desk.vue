<template>
  <div class="flex overflow-hidden">
    <Sidebar
      class="w-sidebar flex-shrink-0 border-r"
      @change-db-file="$emit('change-db-file')"
    />
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
  </div>
</template>
<script>
import Sidebar from '../components/Sidebar';
export default {
  name: 'Desk',
  emits: ['change-db-file'],
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
