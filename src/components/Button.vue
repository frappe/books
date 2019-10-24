<template>
  <button
    class="focus:outline-none rounded-6px"
    :style="style"
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
    }
  },
  computed: {
    style() {
      return {
        padding: this.icon ? '9px 15px' : '6px 24px',
        'background-image':
          this.type === 'primary'
            ? 'linear-gradient(180deg, #2C9AF1 0%, #2490EF 100%)'
            : 'linear-gradient(180deg, #FFFFFF 0%, #F4F4F6 100%)',
        'box-shadow': '0 0.5px 0 0 rgba(0,0,0,0.08)'
      };
    }
  }
};
</script>
