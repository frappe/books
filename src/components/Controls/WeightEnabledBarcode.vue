<template>
  <div
    class="
      px-2
      w-36
      flex
      items-center
      border
      rounded
      bg-gray-50
      dark:text-gray-200
      dark:border-gray-800
      dark:bg-gray-890
      dark:focus-within:bg-gray-900
      focus-within:bg-gray-100
    "
  >
    <input
      ref="scanner"
      type="text"
      class="text-base placeholder-gray-600 w-full bg-transparent outline-none"
      :placeholder="t`Enter weight barcode`"
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
  name: 'WeightEnabledBarcode',
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
      if (this.cooldown === barcode) {
        return;
      }

      this.cooldown = barcode;
      setTimeout(() => (this.cooldown = ''), 100);

      const matchedItems = (await this.fyo.db.getAll('Item', {
        filters: { barcode },
        fields: ['name'],
      })) as { name: string }[];

      const itemName = matchedItems?.[0]?.name;

      if (itemName) {
        this.success(this.t`${itemName} quantity 1 added.`);
        this.$emit('item-selected', itemName);

        return;
      }

      const isWeightEnabled =
        this.fyo.singles.POSSettings?.weightEnabledBarcode;
      const checkDigits = this.fyo.singles.POSSettings?.checkDigits as number;
      const checkDigitsStr = checkDigits.toString();

      const itemCodeDigits = this.fyo.singles.POSSettings
        ?.itemCodeDigits as number;
      const itemWeightDigits = this.fyo.singles.POSSettings
        ?.itemWeightDigits as number;

      if (
        code.length !==
        checkDigitsStr.length + itemCodeDigits + itemWeightDigits
      ) {
        return this.error(this.t`Barcode ${barcode} has an invalid length.`);
      }

      if (!barcode.startsWith(checkDigitsStr)) {
        return this.error(this.t`Item with barcode ${barcode} not found.`);
      }

      const filters: Record<string, string> = {
        itemCode: barcode.slice(
          checkDigitsStr.length,
          checkDigitsStr.length + itemCodeDigits
        ),
      };

      const fields = ['name', 'unit'];

      const items =
        (await this.fyo.db.getAll('Item', { filters, fields })) || [];
      const { name, unit } = items[0] || {};

      if (!name) {
        return this.error(this.t`Item with barcode ${barcode} not found.`);
      }

      const quantity = isWeightEnabled
        ? this.parseBarcode(
            barcode,
            unit as string,
            checkDigitsStr.length + itemCodeDigits
          )
        : 1;

      this.success(this.t`${name as string} quantity ${quantity} added.`);
      this.$emit('item-selected', name, quantity);
    },

    parseBarcode(barcode: string, unitType: string, sliceDigit: number) {
      const weightRaw = parseInt(barcode.slice(sliceDigit));

      let itemQuantity = 0;

      switch (unitType) {
        case 'Kg':
          itemQuantity = Math.floor(weightRaw / 1000);
          break;
        case 'Gram':
          itemQuantity = weightRaw;
          break;
        case 'Unit':
        case 'Meter':
        case 'Hour':
        case 'Day':
          itemQuantity = weightRaw;
          break;
        default:
          throw new Error('Unknown unit type!');
      }

      return itemQuantity;
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
