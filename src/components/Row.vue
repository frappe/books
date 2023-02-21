<template>
  <div class="inline-grid" :style="style" v-bind="$attrs">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'Row',
  props: {
    columnWidth: {
      type: String,
      default: '1fr',
    },
    columnCount: {
      type: Number,
      default: 0,
    },
    ratio: {
      type: Array,
      default: () => [],
    },
    gridTemplateColumns: {
      type: String,
      default: null,
    },
    gap: String,
  },
  computed: {
    style() {
      let obj = {};
      if (this.columnCount) {
        // prettier-ignore
        obj['grid-template-columns'] = `repeat(${this.columnCount}, ${this.columnWidth})`;
      }
      if (this.ratio.length) {
        obj['grid-template-columns'] = this.ratio
          .map((r) => `minmax(0, ${r}fr)`)
          .join(' ');
      }
      if (this.gridTemplateColumns) {
        obj['grid-template-columns'] = this.gridTemplateColumns;
      }
      if (this.gap) {
        obj['grid-gap'] = this.gap;
      }

      return obj;
    },
  },
};
</script>
