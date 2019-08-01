<template>
  <div class="row no-gutters d-flex">
    <sidebar class="sidebar" />
    <div class="page-container bg-white">
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
  width: 100%;
  padding-left: 208px;
  overflow-x: hidden;
}
.sidebar {
  position: fixed;
}
</style>
