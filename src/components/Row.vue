<template>
  <div class="grid border-b" :style="style">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'Row',
  props: {
    columnCount: {
      type: Number,
      default: 0
    },
    ratio: {
      type: Array,
      default: () => []
    },
    gap: String
  },
  computed: {
    style() {
      let obj = {};
      if (this.columnCount) {
        obj['grid-template-columns'] = `repeat(${this.columnCount}, 1fr)`;
      }
      if (this.ratio.length) {
        obj['grid-template-columns'] = this.ratio.map(r => `${r}fr`).join(' ');
      }
      if (this.gap) {
        obj['grid-gap'] = this.gap;
      }

      return obj;
    }
  }
};
</script>
