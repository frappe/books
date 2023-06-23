<template>
  <Tooltip ref="tooltip"><slot></slot></Tooltip>
</template>

<script>
import { defineComponent } from 'vue';
import Tooltip from './Tooltip.vue';

export default defineComponent({
  components: { Tooltip },
  props: { show: { type: Boolean, default: false } },
  watch: {
    show(val) {
      if (val) {
        this.$refs.tooltip.create();
        this.setListeners();
      } else {
        this.$refs.tooltip.destroy();
        this.removeListener();
      }
    },
  },
  methods: {
    mousemoveListener(e) {
      this.$refs.tooltip.update(e);
    },
    setListeners() {
      window.addEventListener('mousemove', this.mousemoveListener);
    },
    removeListener() {
      window.removeEventListener('mousemove', this.mousemoveListener);
    },
  },
});
</script>
