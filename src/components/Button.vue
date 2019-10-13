<template>
  <button
    class="px-4 py-2 focus:outline-none rounded-6px"
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
    }
  },
  computed: {
    style() {
      return {
        'background-image':
          this.type === 'primary'
            ? 'linear-gradient(180deg, #4AC3F8 0%, #2490EF 100%)'
            : 'linear-gradient(180deg, #FFFFFF 0%, #F4F4F6 100%)',
        'box-shadow': '0 0.5px 0 0 rgba(0,0,0,0.08)'
      };
    }
  }
};
</script>
