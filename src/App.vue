<template>
  <div id="app">
    <div class="row no-gutters">
      <sidebar class="col-2" />
      <div class="page-container col-10 bg-light">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar';

export default {
  name: 'App',
  components: {
    Sidebar
  }
}
</script>
<style lang="scss">
@import "styles/index.scss";
</style>
