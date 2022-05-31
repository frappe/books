<template>
  <div class="flex flex-col">
    <!-- Page Header (Title, Buttons, etc) -->
    <PageHeader :backLink="backLink" :title="title">
      <slot name="header" />
    </PageHeader>

    <!-- Invoice Form -->
    <div
      class="
        border
        rounded-lg
        shadow
        flex flex-col
        self-center
        w-form
        h-full
        my-4
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
    backLink: { type: Boolean, default: false },
    title: { type: String, default: '' },
  },
};
</script>
