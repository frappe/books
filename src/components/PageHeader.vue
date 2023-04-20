<template>
  <div
    class="px-4 flex justify-between items-center h-row-largest flex-shrink-0"
    :class="[
      border ? 'border-b' : '',
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
    <h1
      class="text-xl font-semibold select-none whitespace-nowrap"
      v-if="title"
    >
      {{ title }}
    </h1>
    <div class="flex items-stretch window-no-drag gap-2">
      <slot name="left" />
    </div>
    <div
      class="flex items-stretch window-no-drag gap-2 ms-auto"
      :class="platform === 'Mac' && languageDirection === 'rtl' ? 'me-18' : ''"
    >
      <slot />
      <div class="border-e" v-if="showBorder" />
      <BackLink v-if="backLink" class="window-no-drag rtl-rotate-180" />
      <SearchBar v-if="!hideSearch" />
    </div>
  </div>
</template>
<script lang="ts">
import { languageDirectionKey } from 'src/utils/injectionKeys';
import { showSidebar } from 'src/utils/refs';
import { defineComponent, inject, Transition } from 'vue';
import BackLink from './BackLink.vue';
import SearchBar from './SearchBar.vue';

export default defineComponent({
  props: {
    title: { type: String, default: '' },
    backLink: { type: Boolean, default: true },
    hideSearch: { type: Boolean, default: false },
    border: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
  components: { BackLink, SearchBar, Transition },
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
