<!--
  CUSTOM — github.com/wemit/books

  In-app viewer for an Attachment value (image or PDF). Renders the in-memory
  data URL directly — no download, no temp file. PDFs use Chromium's built-in
  viewer, which requires `webPreferences.plugins: true` (set in main.ts).
-->
<template>
  <Modal :open-modal="openModal" @closemodal="$emit('closemodal')">
    <div class="flex flex-col" style="width: 80vw; height: 85vh">
      <!-- Header -->
      <div
        class="
          flex
          justify-between
          items-center
          gap-2
          px-4
          py-3
          border-b
          dark:border-gray-800
        "
      >
        <p class="font-semibold truncate text-gray-900 dark:text-gray-100">
          {{ value?.name }}
        </p>
        <button class="p-0.5 rounded" @click="$emit('closemodal')">
          <FeatherIcon
            name="x"
            class="h-4 w-4 text-gray-600 dark:text-gray-400"
          />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <img
          v-if="isImage"
          :src="value?.data"
          :alt="value?.name"
          class="max-w-full max-h-full mx-auto"
        />
        <iframe
          v-else-if="value?.data"
          :src="value.data"
          :title="value?.name"
          class="w-full h-full border-0"
        />
      </div>
    </div>
  </Modal>
</template>
<script lang="ts">
import { Attachment } from 'fyo/core/types';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import Modal from 'src/components/Modal.vue';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  components: { Modal, FeatherIcon },
  props: {
    openModal: { type: Boolean, default: false },
    value: { type: Object as PropType<Attachment | null>, default: null },
  },
  emits: ['closemodal'],
  computed: {
    isImage(): boolean {
      return !!this.value?.type?.startsWith('image/');
    },
  },
});
</script>
