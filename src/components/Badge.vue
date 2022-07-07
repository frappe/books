<template>
  <div class="inline-block rounded-md px-2 py-1 truncate select-none" :class="colorClass">
    <slot></slot>
  </div>
</template>

<script>
import { getBgTextColorClass } from 'src/utils/colors';

export default {
  name: 'Badge',
  props: {
    color: {
      default: 'gray',
    },
  },
  computed: {
    colorClass() {
      return getBgTextColorClass(this.color);
    },
  },
};
</script>
