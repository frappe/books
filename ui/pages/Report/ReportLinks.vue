<template>
  <div class="row">
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
