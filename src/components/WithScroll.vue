<template>
  <div class="scroll-container">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'WithScroll',
  emits: ['scroll'],
  mounted() {
    this.listener = () => {
      let { scrollLeft, scrollTop } = this.$el;
      this.$emit('scroll', { scrollLeft, scrollTop });
    };
    this.$el.addEventListener('scroll', this.listener);
  },
  beforeUnmount() {
    if (this.listener) {
      this.$el.removeEventListener('scroll', this.listener);
      delete this.listener;
    }
  },
};
</script>

<style>
.scroll-container::-webkit-scrollbar {
  width: var(--w-scrollbar);
  height: var(--w-scrollbar);
}
.scroll-container::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.100');
}
.scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.200');
}
.scroll-container::-webkit-scrollbar-track {
  background-color: white;
}
</style>
