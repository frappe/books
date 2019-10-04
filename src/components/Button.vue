<template>
  <button class="text-sm px-4 py-2 focus:outline-none rounded-lg" :style="style">
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
        'background-image': this.type === 'primary'
          ? 'linear-gradient(180deg, #4AC3F8 0%, #2490EF 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F4F4F6 100%)'
      }
    }
  }
}
</script>
