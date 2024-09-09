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
      dark:bg-gray-890
      focus-within:bg-gray-100
      dark:focus-within:bg-gray-900
    "
  >
    <input
      ref="scanner"
      type="text"
      class="text-base placeholder-gray-600 w-full bg-transparent outline-none"
      :placeholder="t`Enter barcode`"
      @change="handleChange"
    />
    <feather-icon
      name="maximize"
      class="w-3 h-3 text-gray-600 dark:text-gray-400 cursor-text"
      @click="() => ($refs.scanner as HTMLInputElement).focus()"
    />
  </div>
</template>

<script lang="ts">
import { showToast } from 'src/utils/interactive';
import { defineComponent } from 'vue';
export default defineComponent({
  emits: ['item-selected'],
  data() {
    return {
      timerId: null,
      barcode: '',
      cooldown: '',
    } as {
      timerId: null | ReturnType<typeof setTimeout>;
      barcode: string;
      cooldown: string;
    };
  },
  mounted() {
    document.addEventListener('keydown', this.scanListener);
  },
  unmounted() {
    document.removeEventListener('keydown', this.scanListener);
  },
  activated() {
    document.addEventListener('keydown', this.scanListener);
  },
  deactivated() {
    document.removeEventListener('keydown', this.scanListener);
  },
  methods: {
    handleChange(e: Event) {
      const elem = e.target as HTMLInputElement;
      this.selectItem(elem.value);
      elem.value = '';
    },
    async selectItem(code: string) {
      const barcode = code.trim();
      if (!/\d{12,}/.test(barcode)) {
        return this.error(this.t`Invalid barcode value ${barcode}.`);
      }

      /**
       * Between two entries of the same item, this adds
       * a cooldown period of 100ms. This is to prevent
       * double entry.
       */
      if (this.cooldown === barcode) {
        return;
      }
      this.cooldown = barcode;
      setTimeout(() => (this.cooldown = ''), 100);

      const items = (await this.fyo.db.getAll('Item', {
        filters: { barcode },
        fields: ['name'],
      })) as { name: string }[];

      const name = items?.[0]?.name;
      if (!name) {
        return this.error(this.t`Item with barcode ${barcode} not found.`);
      }

      this.success(this.t`${name} quantity 1 added.`);
      this.$emit('item-selected', name);
    },
    async scanListener({ key, code }: KeyboardEvent) {
      /**
       * Based under the assumption that
       * - Barcode scanners trigger keydown events
       * - Keydown events are triggered quicker than human can
       *    i.e. at max 20ms between events
       * - Keydown events are triggered for barcode digits
       * - The sequence of digits might be punctuated by a return
       */

      const keyCode = Number(key);
      const isEnter = code === 'Enter';
      if (Number.isNaN(keyCode) && !isEnter) {
        return;
      }

      if (isEnter) {
        return await this.setItemFromBarcode();
      }

      this.clearInterval();

      this.barcode += key;
      this.timerId = setTimeout(async () => {
        await this.setItemFromBarcode();
        this.barcode = '';
      }, 20);
    },
    async setItemFromBarcode() {
      if (this.barcode.length < 12) {
        return;
      }

      await this.selectItem(this.barcode);

      this.barcode = '';
      this.clearInterval();
    },
    clearInterval() {
      if (this.timerId === null) {
        return;
      }

      clearInterval(this.timerId);
      this.timerId = null;
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
