<template>
  <div class="flex">
    <Sidebar class="w-56" />
    <div class="flex flex-1 overflow-y-hidden">
      <router-view class="flex-1" :key="$route.fullPath" />
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
