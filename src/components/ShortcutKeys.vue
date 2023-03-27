<template>
  <div class="flex-shrink-0 flex items-center gap-2" style="width: fit-content">
    <kbd
      v-for="k in keys"
      :key="k"
      class="key-common"
      :class="{ 'key-styling': !simple }"
      >{{ keyMap[k] ?? k }}</kbd
    >
  </div>
</template>
<script lang="ts">
import { getShortcutKeyMap } from 'src/utils/ui';
import { defineComponent, PropType } from 'vue';
export default defineComponent({
  props: {
    keys: { type: Array as PropType<string[]>, required: true },
    simple: { type: Boolean, default: false },
  },
  method() {},
  computed: {
    keyMap(): Record<string, string> {
      return getShortcutKeyMap(this.platform);
    },
  },
});
</script>
<style scoped>
.key-common {
  font-family: monospace;
  font-weight: 600;
  @apply rounded-md px-1.5 py-0.5 bg-gray-200 text-gray-700
    tracking-tighter;
}

.key-styling {
  @apply border-b-4 border-gray-400 shadow-md;
}
</style>
