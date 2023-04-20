<template>
  <div class="flex bg-gray-25 overflow-x-auto">
    <div class="flex flex-1 flex-col">
      <!-- Page Header (Title, Buttons, etc) -->
      <PageHeader
        v-if="showHeader"
        :title="title"
        :border="false"
        :searchborder="searchborder"
      >
        <template #left>
          <slot name="header-left" />
        </template>
        <slot name="header" />
      </PageHeader>

      <!-- Invoice Form -->
      <div
        class="
          border
          rounded-lg
          shadow-lg
          flex flex-col
          self-center
          w-form
          h-full
          overflow-auto
          mb-4
          bg-white
          mx-4
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
    showHeader: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
});
</script>
