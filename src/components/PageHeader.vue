<template>
  <div class="page-header px-4 py-3 border-bottom bg-white">
    <h5 class="m-0">{{ title }}</h5>
  </div>
</template>
<script>
export default {
  props: ['title']
}
</script>
<style>
.page-header {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
