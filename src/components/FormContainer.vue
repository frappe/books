<template>
  <div class="flex bg-gray-25 overflow-x-auto">
    <div class="flex flex-1 flex-col">
      <!-- Page Header (Title, Buttons, etc) -->
      <PageHeader
        v-if="showHeader"
        :title="title"
        :border="useFullWidth"
        :searchborder="searchborder"
      >
        <template #left>
          <slot name="header-left" />
        </template>
        <slot name="header" />
      </PageHeader>

      <!-- Common Form -->
      <div
        class="flex flex-col self-center h-full overflow-auto bg-white"
        :class="
          useFullWidth
            ? 'w-full'
            : 'w-form border rounded-lg shadow-lg mb-4 mx-4'
        "
      >
        <slot name="body" />
      </div>
    </div>

    <!-- Invoice Quick Edit -->
    <slot name="quickedit" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import PageHeader from './PageHeader.vue';

export default defineComponent({
  components: { PageHeader },
  props: {
    title: { type: String, default: '' },
    useFullWidth: { type: Boolean, default: false },
    showHeader: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
});
</script>
