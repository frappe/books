<template>
  <Modal class="h-auto w-96" :set-close-listener="false">
    <p class="text-center font-semibold py-3 text-gray-800 dark:text-gray-200">
      {{ t`Select the Batch` }}
    </p>

    <div class="px-10 pt-6">
      <Link
        :df="{
          fieldname: 'batch',
          fieldtype: 'Link',
          target: 'Batch',
          label: t`Batch`,
          required: true,
          getOptions: getBatchOptions,
          filters: { item: itemCode },
        }"
        :value="selectedBatch"
        :border="true"
        :show-label="true"
        @change="(value: string) => selectedBatch = value"
      />

      <div class="mt-8 mb-6 grid grid-cols-2 gap-4">
        <Button
          class="w-full bg-green-500 dark:bg-green-700"
          style="padding: 1.35rem"
          :disabled="!selectedBatch"
          @click="submitSelection"
        >
          <p class="uppercase text-lg text-white font-semibold">
            {{ t`Select` }}
          </p>
        </Button>

        <Button
          class="w-full bg-red-500 dark:bg-red-700"
          style="padding: 1.35rem"
          @click="closeModal"
        >
          <p class="uppercase text-lg text-white font-semibold">
            {{ t`Cancel` }}
          </p>
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { t } from 'fyo';
import { showToast } from 'src/utils/interactive';
import Modal from 'src/components/Modal.vue';
import Button from 'src/components/Button.vue';
import Link from 'src/components/Controls/Link.vue';
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';

export default defineComponent({
  name: 'BatchSelectionModal',
  components: {
    Modal,
    Button,
    Link,
  },
  props: {
    itemCode: {
      type: String,
      required: true,
    },
  },
  emits: ['toggleModal', 'batchSelected'],
  data() {
    return {
      selectedBatch: '' as string,
    };
  },
  methods: {
    async getBatchOptions() {
      if (!this.itemCode) {
        return [];
      }

      try {
        const batches = (await fyo.db.getAll(ModelNameEnum.Batch, {
          filters: { item: this.itemCode },
          fields: ['name'],
        })) as { name: string; itemCode: string }[];

        return batches.map((b) => ({ label: b.name, value: b.name }));
      } catch (error) {
        showToast({ type: 'error', message: t`Failed to load batches` });
        return [];
      }
    },
    submitSelection() {
      this.$emit('batchSelected', this.selectedBatch);
      this.$emit('toggleModal', 'BatchSelection');
      this.selectedBatch = '';
    },
    closeModal() {
      this.$emit('toggleModal', 'BatchSelection');
      this.selectedBatch = '';
    },
  },
});
</script>
