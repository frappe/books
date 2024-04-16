<template>
  <Transition>
    <div
      v-if="openModal"
      class="backdrop z-20 flex justify-center items-center"
      @click="$emit('closemodal')"
    >
      <div
        class="bg-white dark:bg-gray-850 rounded-lg shadow-2xl border dark:border-gray-800 overflow-hidden inner"
        v-bind="$attrs"
        @click.stop
      >
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { shortcutsKey } from 'src/utils/injectionKeys';
import { defineComponent, inject } from 'vue';

export default defineComponent({
  props: {
    openModal: {
      default: false,
      type: Boolean,
    },
  },
  emits: ['closemodal'],
  setup() {
    const context = `Modal-` + Math.random().toString(36).slice(2, 6);
    return { shortcuts: inject(shortcutsKey), context };
  },
  watch: {
    openModal(value: boolean) {
      if (value) {
        this.shortcuts?.set(this.context, ['Escape'], () => {
          this.$emit('closemodal');
        });
      } else {
        this.shortcuts?.delete(this.context);
      }
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
