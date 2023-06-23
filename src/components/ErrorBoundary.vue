<template>
  <slot></slot>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  props: { propagate: { type: Boolean, default: true } },
  emits: ['error-captured'],
  errorCaptured(error) {
    this.$emit('error-captured', error);
    return this.propagate;
  },
});
</script>
