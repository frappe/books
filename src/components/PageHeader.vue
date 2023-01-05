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
        v-if="!sidebar && platform === 'Mac'"
        class="h-full"
        :class="sidebar ? '' : 'w-tl mr-4 border-r'"
      />
    </Transition>
    <h1 class="text-xl font-semibold select-none" v-if="title">
      {{ title }}
    </h1>
    <div class="flex items-stretch window-no-drag gap-2 ml-auto">
      <slot />
      <div class="border-r" v-if="showBorder" />
      <BackLink v-if="backLink" class="window-no-drag" />
      <SearchBar v-if="!hideSearch" />
    </div>
  </div>
</template>
<script>
import { Transition } from 'vue';
import BackLink from './BackLink.vue';
import SearchBar from './SearchBar.vue';

export default {
  inject: ['sidebar'],
  props: {
    title: { type: String, default: '' },
    backLink: { type: Boolean, default: true },
    hideSearch: { type: Boolean, default: false },
    border: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
  components: { SearchBar, BackLink, Transition },
  computed: {
    showBorder() {
      return !!this.$slots.default && this.searchborder;
    },
  },
};
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
