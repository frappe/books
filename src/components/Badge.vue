<template>
  <div class="inline-block rounded-md px-2 py-1 truncate" :class="colorClass">
    <slot></slot>
  </div>
</template>

<script>
import { getColorClass } from '../colors';

export default {
  name: 'Badge',
  props: {
    color: {
      default: 'gray',
    },
  },
  computed: {
    colorClass() {
      return getColorClass(this.color);
    },
  },
};
</script>
