<template>
  <div class="flex">
    <Sidebar class="w-56" />
    <div class="flex-1 overflow-y-hidden">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>
<script>
import Sidebar from '../components/Sidebar';
export default {
  name: 'Desk',
  components: {
    Sidebar
  }
};
</script>
<style>
.page-container {
  height: 100vh;
  max-height: 100vh;
  width: 100%;
  padding-left: 208px;
  overflow-x: hidden;
}
.sidebar {
  position: fixed;
  z-index: 20;
}
</style>
