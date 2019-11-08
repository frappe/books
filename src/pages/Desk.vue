<template>
  <div class="flex">
    <Sidebar class="w-56 flex-shrink-0" />
    <div class="flex flex-1 overflow-y-hidden bg-white">
      <keep-alive include="InvoiceForm">
        <router-view class="flex-1" :key="$route.fullPath" />
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
    </div>
  </div>
</template>
<script>
import Sidebar from '../components/Sidebar';
export default {
  name: 'Desk',
  components: {
    Sidebar
  },
  computed: {
    showQuickEdit() {
      return (
        this.$route.query.edit &&
        this.$route.query.doctype &&
        this.$route.query.name
      );
    }
  }
};
</script>
