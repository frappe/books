<template>
  <div class="flex flex-col bg-gray-25">
    <!-- Page Header (Title, Buttons, etc) -->
    <PageHeader :title="title" :border="false">
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
</template>
<script>
import PageHeader from './PageHeader.vue';
export default {
  components: { PageHeader },
  props: {
    title: { type: String, default: '' },
  },
};
</script>
