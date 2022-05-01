<template>
  <div class="my-4 mx-4 flex justify-between window-drag">
    <h1 class="text-2xl font-bold select-none" v-if="title && !backLink">
      {{ title }}
    </h1>
    <BackLink v-if="backLink" />
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
