<template>
  <div class="grid border-b" :style="style">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'ListRow',
  props: {
    columnCount: {
      type: Number,
      default: 0
    },
    ratio: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    style() {
      if (this.columnCount) {
        return {
          'grid-template-columns': `repeat(${this.columnCount}, 1fr)`
        }
      }
      if (this.ratio.length) {
        return {
          'grid-template-columns': this.ratio.map(r => `${r}fr`).join(' ')
        }
      }
    }
  }
}
</script>
