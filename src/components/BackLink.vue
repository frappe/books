<template>
  <a
    ref="backlink"
    class="
      cursor-pointer
      font-semibold
      flex
      items-center
      bg-gray-200
      text-gray-700
      px-3
      rounded-md
    "
    @click="$router.back()"
  >
    <feather-icon name="chevron-left" class="w-4 h-4" />
  </a>
</template>
<script lang="ts">
import { shortcutsKey } from 'src/utils/injectionKeys';
import { ref, inject } from 'vue';
import { defineComponent } from 'vue';

const COMPONENT_NAME = 'BackLink';

export default defineComponent({
  setup() {
    return {
      backlink: ref<HTMLAnchorElement | null>(null),
      shortcuts: inject(shortcutsKey),
    };
  },
  activated() {
    this.shortcuts?.shift.set(COMPONENT_NAME, ['Backspace'], () => {
      this.backlink?.click();
    });
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
});
</script>
