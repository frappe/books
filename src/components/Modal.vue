<template>
  <Transition>
    <div
      class="
        fixed
        top-0
        start-0
        w-screen
        h-screen
        z-20
        flex
        justify-center
        items-center
      "
      :style="
        useBackdrop
          ? 'background: rgba(0, 0, 0, 0.1); backdrop-filter: blur(2px)'
          : ''
      "
      @click="$emit('closemodal')"
      v-if="openModal"
    >
      <div
        class="bg-white rounded-lg shadow-2xl border overflow-hidden inner"
        v-bind="$attrs"
        @click.stop
      >
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    openModal: {
      default: false,
      type: Boolean,
    },
    useBackdrop: {
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
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: all 100ms ease-out;
}

.inner {
  transition: all 150ms ease-out;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.v-enter-from .inner,
.v-leave-to .inner {
  transform: translateY(-50px);
}

.v-enter-to .inner,
.v-leave-from .inner {
  transform: translateY(0px);
}
</style>
