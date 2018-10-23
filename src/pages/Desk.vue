<template>
  <div class="row no-gutters">
    <sidebar class="col-2" />
    <div class="page-container col-10 bg-light">
      <router-view />
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
}
</script>
<style>
.page-container {
  height: 100vh;
  overflow: auto;
  overflow-x: hidden;
}
</style>
