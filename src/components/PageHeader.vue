<template>
  <div
    class="px-4 flex justify-between items-center h-row-largest flex-shrink-0 dark:bg-gray-875"
    :class="[
      border ? 'border-b dark:border-gray-800' : '',
      platform !== 'Windows' ? 'window-drag' : '',
    ]"
  >
    <Transition name="spacer">
      <div
        v-if="!showSidebar && platform === 'Mac' && languageDirection !== 'rtl'"
        class="h-full"
        :class="spacerClass"
      />
    </Transition>

    <div
      class="flex items-center window-no-drag gap-4 me-auto"
      :class="platform === 'Mac' && languageDirection === 'rtl' ? 'me-18' : ''"
    >
      <!-- Nav Group -->
      <PageHeaderNavGroup />
      <h1
        v-if="title"
        class="text-xl font-semibold select-none whitespace-nowrap dark:text-white"
      >
        {{ title }}
      </h1>

      <!-- Left Slot -->
      <div class="flex items-stretch window-no-drag gap-4">
        <slot name="left" />
      </div>
    </div>

    <!-- Right (regular) Slot -->
    <div
      class="flex items-stretch window-no-drag gap-2 ms-auto"
      :class="platform === 'Mac' && languageDirection === 'rtl' ? 'me-18' : ''"
    >
      <slot />
    </div>
  </div>
</template>
<script lang="ts">
import { languageDirectionKey } from 'src/utils/injectionKeys';
import { showSidebar } from 'src/utils/refs';
import { defineComponent, inject, Transition } from 'vue';
import PageHeaderNavGroup from './PageHeaderNavGroup.vue';

export default defineComponent({
  components: { Transition, PageHeaderNavGroup },
  props: {
    title: { type: String, default: '' },
    border: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
  setup() {
    return { showSidebar, languageDirection: inject(languageDirectionKey) };
  },
  computed: {
    showBorder() {
      return !!this.$slots.default && this.searchborder;
    },
    spacerClass() {
      if (this.showSidebar) {
        return '';
      }

      if (this.border) {
        return 'w-tl me-4 border-e';
      }

      return 'w-tl me-4';
    },
  },
});
</script>
<style scoped>
.w-tl {
  width: var(--w-trafficlights);
}

.spacer-enter-from,
.spacer-leave-to {
  opacity: 0;
  width: 0px;
  margin-right: 0px;
  border-right-width: 0px;
}

.spacer-enter-to,
.spacer-leave-from {
  opacity: 1;
  width: var(--w-trafficlights);
  margin-right: 1rem;
  border-right-width: 1px;
}

.spacer-enter-active,
.spacer-leave-active {
  transition: all 150ms ease-out;
}
</style>
