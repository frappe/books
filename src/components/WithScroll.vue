<template>
  <div class="custom-scroll custom-scroll-thumb1">
    <slot></slot>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'WithScroll',
  emits: ['scroll'],
  data() {
    return { listener: undefined } as { listener?: () => void };
  },
  mounted() {
    this.listener = () => {
      let { scrollLeft, scrollTop } = this.$el;
      this.$emit('scroll', { scrollLeft, scrollTop });
    };
    this.$el.addEventListener('scroll', this.listener);
  },
  beforeUnmount() {
    if (!this.listener) {
      return;
    }

    this.$el.removeEventListener('scroll', this.listener);
    delete this.listener;
  },
});
</script>
