<template>
  <div class="flex">
    <SearchBar />
    <!-- Back Button -->
    <a
      ref="backlink"
      class="nav-link border-l border-r border-white"
      :class="
        historyState.back ? 'text-gray-700 cursor-pointer' : 'text-gray-400'
      "
      @click="$router.back()"
    >
      <feather-icon name="chevron-left" class="w-4 h-4" />
    </a>
    <!-- Forward Button -->
    <a
      class="nav-link rounded-md rounded-l-none"
      :class="
        historyState.forward ? 'text-gray-700 cursor-pointer' : 'text-gray-400'
      "
      @click="$router.forward()"
    >
      <feather-icon name="chevron-right" class="w-4 h-4" />
    </a>
  </div>
</template>
<script lang="ts">
import { shortcutsKey } from 'src/utils/injectionKeys';
import { ref, inject } from 'vue';
import { defineComponent } from 'vue';
import SearchBar from './SearchBar.vue';
import { historyState } from 'src/utils/refs';

const COMPONENT_NAME = 'PageHeaderNavGroup';

export default defineComponent({
  setup() {
    return {
      historyState,
      backlink: ref<HTMLAnchorElement | null>(null),
      shortcuts: inject(shortcutsKey),
    };
  },
  activated() {
    this.shortcuts?.shift.set(COMPONENT_NAME, ['Backspace'], () => {
      this.backlink?.click();
    });
    // @ts-ignore
    window.ng = this;
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  components: { SearchBar },
  computed: {
    hasBack() {
      return !!history.back;
    },
    hasForward() {
      return !!history.forward;
    },
  },
});
</script>

<style scoped>
.nav-link {
  @apply flex items-center bg-gray-200 px-3;
}
</style>
