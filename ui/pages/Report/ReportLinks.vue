<template>
  <div class="page-header pr-4 ml-0 pl-0 py-2 d-flex align-items-center border-bottom bg-white">
    <div class="text-right ml-2" v-for="link of links" :key="link.label">
      <f-button secondary @click="link.handler">{{ link.label }}</f-button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['links']
};
</script>

<style>
</style>
