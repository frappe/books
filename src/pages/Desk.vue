<template>
  <div class="flex overflow-hidden">
    <Sidebar
      class="w-44 flex-shrink-0"
      @change-db-file="$emit('change-db-file')"
    />
    <div class="flex flex-1 overflow-y-hidden bg-white">
      <keep-alive>
        <router-view class="flex-1" :key="$route.path" />
      </keep-alive>
      <div class="flex" v-if="showQuickEdit">
        <keep-alive>
          <router-view
            name="edit"
            class="w-80 flex-1"
            :key="$route.query.doctype + $route.query.name"
          />
        </keep-alive>
      </div>
      <div
        id="toast-container"
        class="absolute bottom-0 flex flex-col items-center mb-3"
        style="width: calc(100% - 11rem)"
      >
        <div id="toast-target" />
      </div>
    </div>
  </div>
</template>
<script>
import Sidebar from '../components/Sidebar';
export default {
  name: 'Desk',
  components: {
    Sidebar,
  },
  computed: {
    showQuickEdit() {
      return (
        this.$route.query.edit &&
        this.$route.query.doctype &&
        this.$route.query.name
      );
    },
  },
};
</script>
