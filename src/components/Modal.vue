<template>
  <div
    class="
      fixed
      top-0
      left-0
      w-screen
      h-screen
      z-20
      flex
      justify-center
      items-center
    "
    style="background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(4px)"
    @click="$emit('closemodal')"
    v-if="openModal"
  >
    <div
      class="bg-white rounded-lg shadow-2xl w-form border overflow-hidden"
      v-bind="$attrs"
      @click.stop
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    openModal: {
      default: false,
      type: Boolean,
    },
    setCloseListener: {
      default: true,
      type: Boolean,
    },
  },
  emits: ['closemodal'],
  watch: {
    openModal(value: boolean) {
      if (value) {
        document.addEventListener('keyup', this.escapeEventListener);
      } else {
        document.removeEventListener('keyup', this.escapeEventListener);
      }
    },
  },
  methods: {
    escapeEventListener(event: KeyboardEvent) {
      if (event.code !== 'Escape') {
        return;
      }

      this.$emit('closemodal');
    },
  },
});
</script>
