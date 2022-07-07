<template>
  <button
    class="
      focus:outline-none
      rounded-md
      flex
      justify-center
      items-center
      h-8
      text-sm
    "
    :class="_class"
    v-bind="$attrs"
  >
    <slot></slot>
  </button>
</template>
<script>
export default {
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
  },
  computed: {
    _class() {
      return {
        'opacity-50 cursor-not-allowed pointer-events-none': this.disabled,
        'text-white': this.type === 'primary',
        'bg-blue-500': this.type === 'primary',
        'text-gray-700': this.type !== 'primary',
        'bg-gray-200': this.type !== 'primary',
        'px-3': this.padding && this.icon,
        'px-6': this.padding && !this.icon,
      };
    },
  },
};
</script>
<style scoped>
button:focus {
  filter: brightness(0.95);
}
</style>
