<template>
  <slot></slot>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  emits: ['error-captured'],
  props: { propagate: { type: Boolean, default: true } },
  errorCaptured(error) {
    this.$emit('error-captured', error);
    return this.propagate;
  },
});
</script>
