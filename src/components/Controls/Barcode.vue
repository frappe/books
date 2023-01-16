<template>
  <div
    class="
      flex
      items-center
      border
      w-36
      rounded
      px-2
      bg-gray-50
      focus-within:bg-gray-100
    "
  >
    <input
      ref="scanner"
      type="text"
      class="text-base placeholder-gray-600 w-full bg-transparent outline-none"
      @change="handleChange"
      :placeholder="t`Enter barcode`"
    />
    <feather-icon
      name="maximize"
      class="w-3 h-3 text-gray-600 cursor-text"
      @click="() => ($refs.scanner as HTMLInputElement).focus()"
    />
  </div>
</template>

<script lang="ts">
import { showToast } from 'src/utils/ui';
import { defineComponent } from 'vue';
export default defineComponent({
  emits: ['item-selected'],
  methods: {
    handleChange(e: Event) {
      const elem = e.target as HTMLInputElement;
      this.getItem(elem.value);
      elem.value = '';
    },
    async getItem(code: string) {
      const barcode = code.trim();
      if (!/\d{12,}/.test(barcode)) {
        return this.error(this.t`Invalid barcode value ${barcode}.`);
      }

      const items = (await this.fyo.db.getAll('Item', {
        filters: { barcode },
        fields: ['name'],
      })) as { name: string }[];

      const name = items?.[0]?.name;
      if (!name) {
        return this.error(this.t`Item with barcode ${barcode} not found.`);
      }

      this.success(this.t`${name} added.`);
      this.$emit('item-selected', name);
    },
    error(message: string) {
      showToast({ type: 'error', message });
    },
    success(message: string) {
      showToast({ type: 'success', message });
    },
  },
});
</script>
