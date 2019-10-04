<template>
  <div class="list-row border-b" :style="style">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'ListRow',
  props: {
    columnCount: {
      type: Number,
      default: 1
    }
  },
  computed: {
    style() {
      return {
        'grid-template-columns': `repeat(${this.columnCount}, 1fr)`
      }
    }
  }
}
</script>
<style>
.list-row {
  display: grid;
}
</style>
