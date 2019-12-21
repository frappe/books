<template>
  <button
    class="focus:outline-none rounded-md shadow-button flex-center"
    :style="style"
    :class="_class"
    v-bind="$attrs"
    v-on="$listeners"
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
      default: 'secondary'
    },
    icon: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    style() {
      return {
        padding: this.icon ? '6px 12px' : '6px 24px',
        'background-image':
          this.type === 'primary'
            ? 'linear-gradient(180deg, #2C9AF1 0%, #2490EF 100%)'
            : 'linear-gradient(180deg, #F9F9FA 0%, #F4F4F6 100%)'
      };
    },
    _class() {
      return {
        'opacity-50 cursor-not-allowed pointer-events-none': this.disabled
      };
    }
  }
};
</script>
