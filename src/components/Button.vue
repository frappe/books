<template>
  <button
    class="rounded-md flex justify-center items-center text-sm"
    :disabled="disabled"
    :class="_class"
    v-bind="$attrs"
  >
    <slot></slot>
  </button>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Button',
  props: {
    type: {
      type: String,
      default: 'secondary',
    },
    icon: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    padding: {
      type: Boolean,
      default: true,
    },
    background: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    _class() {
      return {
        'opacity-50 cursor-not-allowed pointer-events-none': this.disabled,
        'text-white dark:text-black': this.type === 'primary',
        'bg-black dark:bg-gray-400 dark:font-semibold':
          this.type === 'primary' && this.background,
        'text-gray-700 dark:text-gray-200': this.type !== 'primary',
        'bg-gray-200 dark:bg-gray-900':
          this.type !== 'primary' && this.background,
        'h-8': this.background,
        'px-3': this.padding && this.icon,
        'px-6': this.padding && !this.icon,
      };
    },
  },
});
</script>
<style scoped>
button:focus {
  filter: brightness(0.95);
}
</style>
