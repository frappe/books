<template>
  <div
    class="
      px-4
      text-xl
      font-semibold
      flex
      justify-between
      h-row-large
      items-center
      flex-shrink-0
    "
  >
    <h1 v-if="formTitle" class="dark:text-gray-25">{{ formTitle }}</h1>
    <slot />
    <p v-if="formSubTitle" class="text-gray-600 dark:text-gray-400">
      {{ formSubTitle }}
    </p>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    formTitle: { type: String, default: '' },
    formSubTitle: { type: String, default: '' },
  },
});
</script>
