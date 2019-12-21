<template>
  <div
    class="inline-block rounded-md px-2 py-1 truncate"
    :class="getColorClass"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'Badge',
  props: {
    color: {
      default: 'gray'
    }
  },
  computed: {
    getColorClass() {
      return {
        gray: 'bg-gray-100 text-gray-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        orange: 'bg-orange-100 text-orange-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600'
      }[this.color];
    }
  }
};
</script>
