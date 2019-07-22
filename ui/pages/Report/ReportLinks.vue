<template>
  <div class="page-header px-4 py-3 d-flex align-items-center border-bottom bg-white">
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
