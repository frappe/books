<template>
  <div>
    <div v-if="showLabel && df" :class="labelClasses">
      {{ df.label }}
    </div>
    <div :class="containerClasses" class="flex gap-2 items-center">
      <label
        for="attachment"
        class="block whitespace-nowrap overflow-auto no-scrollbar"
        :class="[
          inputClasses,
          !value ? 'text-gray-600 dark:text-gray-400' : 'cursor-default',
        ]"
        >{{ label }}</label
      >
      <input
        id="attachment"
        ref="fileInput"
        type="file"
        accept="image/*,.pdf"
        class="hidden"
        :disabled="!!value"
        @input="selectFile"
      />

      <!-- Buttons -->
      <div class="me-2 flex gap-1">
        <!-- Upload Button -->
        <button v-if="!value" class="p-0.5 rounded" @click="upload">
          <FeatherIcon
            name="upload"
            class="h-4 w-4 text-gray-600 dark:text-gray-400"
          />
        </button>

        <!-- Download Button -->
        <button v-if="value" class="p-0.5 rounded" @click="download">
          <FeatherIcon
            name="download"
            class="h-4 w-4 text-gray-600 dark:text-gray-400"
          />
        </button>

        <!-- Clear Button -->
        <button
          v-if="value && !isReadOnly"
          class="p-0.5 rounded"
          @click="clear"
        >
          <FeatherIcon
            name="x"
            class="h-4 w-4 text-gray-600 dark:text-gray-400"
          />
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { t } from 'fyo';
import { Attachment } from 'fyo/core/types';
import { Field } from 'schemas/types';
import { convertFileToDataURL } from 'src/utils/misc';
import { defineComponent, PropType } from 'vue';
import FeatherIcon from '../FeatherIcon.vue';
import Base from './Base.vue';

export default defineComponent({
  components: { FeatherIcon },
  extends: Base,
  props: {
    df: Object as PropType<Field>,
    value: { type: Object as PropType<Attachment | null>, default: null },
    border: { type: Boolean, default: false },
    size: String,
  },
  computed: {
    label() {
      if (this.value) {
        return this.value.name;
      }

      return this.df?.placeholder ?? this.df?.label ?? t`Attachment`;
    },
    inputReadOnlyClasses() {
      if (!this.value) {
        return 'text-gray-600';
      } else if (this.isReadOnly) {
        return 'text-gray-800 cursor-default';
      }

      return 'text-gray-900';
    },
    containerReadOnlyClasses() {
      return '';
    },
  },
  methods: {
    upload() {
      (this.$refs.fileInput as HTMLInputElement).click();
    },
    clear() {
      (this.$refs.fileInput as HTMLInputElement).value = '';
      // @ts-ignore
      this.triggerChange(null);
    },
    download() {
      if (!this.value) {
        return;
      }

      const { name, data } = this.value;
      if (!name || !data) {
        return;
      }

      const a = document.createElement('a');

      a.style.display = 'none';
      a.href = data;
      a.target = '_self';
      a.download = name;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    async selectFile(e: Event) {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        return;
      }

      const attachment = await this.getAttachment(file);
      // @ts-ignore
      this.triggerChange(attachment);
    },
    async getAttachment(file: File | null) {
      if (!file) {
        return null;
      }

      const name = file.name;
      const type = file.type;
      const data = await convertFileToDataURL(file, type);
      return { name, type, data };
    },
  },
});
</script>
