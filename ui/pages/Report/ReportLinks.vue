<template>
  <div class="row">
    <div class="col-12 text-right" v-for="link of links" :key="link.label">
      <f-button primary @click="link.handler">{{ link.label }}</f-button>
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
