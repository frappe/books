<template>
  <div class="flex bg-gray-25">
    <div class="flex flex-1 flex-col">
      <!-- Page Header (Title, Buttons, etc) -->
      <PageHeader :title="title" :border="false" :searchborder="searchborder">
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
          mb-4
          bg-white
        "
      >
        <slot name="body" />
      </div>
    </div>

    <!-- Invoice Quick Edit -->
    <slot name="quickedit" />
  </div>
</template>
<script>
import PageHeader from './PageHeader.vue';
export default {
  components: { PageHeader },
  props: {
    title: { type: String, default: '' },
    searchborder: { type: Boolean, default: true },
  },
};
</script>
