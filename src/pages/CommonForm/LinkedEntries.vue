<template>
  <div class="w-quick-edit bg-white border-l">
    <div
      class="
        flex
        items-center
        justify-between
        px-4
        h-row-largest
        sticky
        top-0
        border-b
      "
      style="z-index: 1"
    >
      <div class="flex items-center justify-between w-full">
        <Button :icon="true" @click="$emit('close')">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <p class="text-xl font-semibold text-gray-600">
          {{ t`Linked Entries` }}
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import Button from 'src/components/Button.vue';
import { defineComponent } from 'vue';
import { PropType } from 'vue';

export default defineComponent({
  emits: ['close'],
  props: { doc: { type: Object as PropType<Doc>, required: true } },
  mounted() {},
  components: { Button },
});
</script>
