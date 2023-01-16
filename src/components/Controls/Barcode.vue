<template>
  <div>
    <Button :icon="true" @click="openModal = true">{{
      t`Scan Barcode`
    }}</Button>
    <Modal :open-modal="openModal" @closemodal="openModal = false">
      <FormHeader :form-title="t`Barcode Scanner`" />
      <hr />
      <div class="p-4">
        <div class="w-full flex flex-col justify-center items-center">
          <input
            type="text"
            class="
              border
              w-96
              rounded
              text-base
              px-3
              py-2
              placeholder-gray-600
              bg-gray-50
              focus-within:bg-gray-100
            "
            @change="(e) => getItem((e.target as HTMLInputElement)?.value)"
            :placeholder="t`Enter barcode`"
          />
          <div v-if="error" class="text-sm text-red-600 mt-4 w-96 text-center">
            {{ error }}
          </div>
          <div
            v-if="success"
            class="text-sm text-green-600 mt-4 w-96 text-center"
          >
            {{ success }}
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import Button from '../Button.vue';
import FormHeader from '../FormHeader.vue';
import Modal from '../Modal.vue';
export default defineComponent({
  components: { Button, Modal, FormHeader },
  emits: ['item-selected'],
  watch: {
    openModal(value: boolean) {
      if (value) {
        return;
      }

      this.clear();
    },
    error(value: string) {
      if (!value) {
        return;
      }

      this.success = '';
    },
    success(value: string) {
      if (!value) {
        return;
      }

      this.error = '';
    },
  },
  data() {
    return {
      openModal: false,
      error: '',
      success: '',
    } as {
      openModal: boolean;
      error: string;
      success: string;
    };
  },
  methods: {
    clear() {
      this.error = '';
      this.success = '';
    },
    async getItem(code: string) {
      const barcode = code.trim();
      if (!/\d{12,}/.test(barcode)) {
        return (this.error = this.t`Invalid barcode ${barcode}.`);
      }

      const items = (await this.fyo.db.getAll('Item', {
        filters: { barcode },
        fields: ['name'],
      })) as { name: string }[];

      const name = items?.[0]?.name;
      if (!name) {
        return (this.error = this.t`Item with barcode ${barcode} not found.`);
      }

      this.success = this.t`Quantity 1 of ${name} added.`;
      this.$emit('item-selected', name);
    },
  },
});
</script>
