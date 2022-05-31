<template>
  <div class="p-4 flex justify-between window-drag border-b items-center">
    <h1 class="text-xl font-semibold select-none" v-if="title && !backLink">
      {{ title }}
    </h1>
    <BackLink v-if="backLink" class="window-no-drag"/>
    <div class="flex items-stretch window-no-drag gap-2">
      <slot />
      <SearchBar v-if="!hideSearch"/>
    </div>
  </div>
</template>
<script>
import BackLink from './BackLink.vue';
import SearchBar from './SearchBar.vue';

export default {
  props: {
    title: { type: String, default: '' },
    backLink: { type: Boolean, default: false },
    hideSearch: { type: Boolean, default: false },
  },
  components: { SearchBar, BackLink },
};
</script>
