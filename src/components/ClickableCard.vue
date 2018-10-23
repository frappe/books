<template>
  <div class="card" @click="$emit('click')">
    <div class="card-body">
      <h5 class="card-title">{{ title }}</h5>
      <p class="card-text">
        {{ description }}
      </p>
    </div>
  </div>
</template>
<script>
export default {
  props: ['title', 'description']
}
</script>
<style scoped>
.card {
  cursor: pointer;
}
</style>
