<template>
  <div>
    <feather-icon
      :name="isExapanded ? 'chevron-up' : 'chevron-down'"
      class="w-4 h-4 inline-flex dark:text-white"
      @click="isExapanded = !isExapanded"
    />
  </div>

  <div class="relative" @click="isExapanded = !isExapanded">
    <Link
      :df="{
        fieldname: 'item',
        fieldtype: 'Data',
        label: t`Item`,
      }"
      :class="row.isFreeItem ? 'mt-2' : ''"
      size="small"
      :border="false"
      :value="row.item"
      :read-only="true"
    />
    <p
      v-if="row.isFreeItem"
      class="absolute flex top-0 font-medium text-xs ml-2 text-green-800"
      style="font-size: 0.6rem"
    >
      {{ row.pricingRule }}
    </p>
  </div>

  <Int
    :df="{
      fieldname: 'quantity',
      fieldtype: 'Int',
      label: t`Quantity`,
    }"
    size="small"
    :border="false"
    :value="row.quantity"
    :read-only="true"
  />

  <Currency
    :df="{
      fieldtype: 'Currency',
      fieldname: 'rate',
      label: t`Rate`,
    }"
    size="small"
    :border="false"
    :value="row.rate"
    :read-only="true"
  />

  <Currency
    :df="{
      fieldtype: 'Currency',
      fieldname: 'amount',
      label: t`Amount`,
    }"
    size="small"
    :border="false"
    :value="row.amount"
    :read-only="true"
  />

  <div class="flex justify-center">
    <feather-icon
      name="trash"
      class="w-4 text-xl text-red-500"
      @click="removeAddedItem(row)"
    />
  </div>

  <div></div>

  <template v-if="isExapanded">
    <div class="rounded-md grid grid-cols-4 my-3" style="width: 27vw">
      <div class="px-4 col-span-2">
        <Float
          :df="{
            fieldname: 'quantity',
            fieldtype: 'Float',
            label: t`Quantity`,
          }"
          @click="handleOpenKeyboard(row, 'quantity')"
          size="medium"
          :min="0"
          :border="true"
          :show-label="true"
          :value="row.quantity"
          :read-only="isReadOnly"
        />
      </div>

      <div class="px-4 col-span-2">
        <Link
          v-if="isUOMConversionEnabled"
          :df="{
            fieldname: 'transferUnit',
            fieldtype: 'Link',
            target: 'UOM',
            label: t`Transfer Unit`,
          }"
          size="medium"
          :show-label="true"
          :border="true"
          :value="row.transferUnit"
          :read-only="isReadOnly"
        />
      </div>

      <div class="px-4 pt-6 col-span-2">
        <Int
          v-if="isUOMConversionEnabled"
          :df="{
            fieldtype: 'Int',
            fieldname: 'transferQuantity',
            label: t`Transfer Quantity`,
          }"
          @click="!isReadOnly && handleOpenKeyboard(row, 'transferQuantity')"
          size="medium"
          :border="true"
          :show-label="true"
          :value="row.transferQuantity"
          :read-only="isReadOnly"
        />
      </div>
      <div class="px-4 pt-6 col-span-2">
        <Currency
          :df="{
            fieldtype: 'Currency',
            fieldname: 'rate',
            label: t`Rate`,
          }"
          @click="!isReadOnly && handleOpenKeyboard(row, 'rate')"
          size="medium"
          :show-label="true"
          :border="true"
          :value="row.rate"
          :read-only="isReadOnly"
        />
      </div>
      <div class="px-4 col-span-2 mt-5">
        <Currency
          v-if="isDiscountingEnabled"
          :df="{
            fieldtype: 'Currency',
            fieldname: 'discountAmount',
            label: 'Discount Amount',
          }"
          @click="handleOpenKeyboard(row, 'itemDiscountAmount')"
          class="col-span-2"
          size="medium"
          :show-label="true"
          :border="true"
          :value="row.itemDiscountAmount"
          :read-only="row.itemDiscountPercent as number > 0 || isReadOnly"
        />
      </div>

      <div class="px-4 col-span-2 mt-5">
        <Float
          v-if="isDiscountingEnabled"
          :df="{
            fieldtype: 'Float',
            fieldname: 'itemDiscountPercent',
            label: t`Discount Percent`,
          }"
          @click="handleOpenKeyboard(row, 'itemDiscountPercent')"
          size="medium"
          :show-label="true"
          :border="true"
          :value="row.itemDiscountPercent"
          :read-only="!row.itemDiscountAmount?.isZero() || isReadOnly"
        />
      </div>

      <div
        v-if="row.links?.item && row.links?.item.hasBatch"
        class="px-4 pt-6 col-span-2"
      >
        <Link
          :df="{
            fieldname: 'batch',
            fieldtype: 'Link',
            target: 'Batch',
            label: t`Batch`,
            filters: { item: row.item as string},
          }"
          size="medium"
          :value="row.batch"
          :border="true"
          :show-label="true"
          :read-only="false"
          @change="(value:string) => setBatch(value)"
        />
      </div>

      <div
        v-if="row.links?.item && row.links?.item.hasBatch"
        class="px-4 pt-6 col-span-2"
      >
        <Float
          :df="{
            fieldname: 'availableQtyInBatch',
            fieldtype: 'Float',
            label: t`Qty in Batch`,
          }"
          size="medium"
          :min="0"
          :value="availableQtyInBatch"
          :show-label="true"
          :border="true"
          :read-only="true"
          :text-right="true"
        />
      </div>

      <div v-if="hasSerialNumber" class="px-4 pt-6 col-span-4">
        <Text
          :df="{
            label: t`Serial Number`,
            fieldtype: 'Text',
            fieldname: 'serialNumber',
          }"
          :value="row.serialNumber"
          :show-label="true"
          :border="true"
          :required="hasSerialNumber"
          @change="(value:string)=> setSerialNumber(value)"
        />
      </div>
    </div>
  </template>
</template>

<script lang="ts">
import Currency from 'src/components/Controls/Currency.vue';
import Data from 'src/components/Controls/Data.vue';
import Float from 'src/components/Controls/Float.vue';
import Int from 'src/components/Controls/Int.vue';
import Link from 'src/components/Controls/Link.vue';
import Text from 'src/components/Controls/Text.vue';
import { inject } from 'vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { Money } from 'pesa';
import { validateSerialNumberCount } from 'src/utils/pos';

export default defineComponent({
  name: 'ModernPOSSelectedItemRow',
  components: { Currency, Data, Float, Int, Link, Text },
  props: {
    row: { type: SalesInvoiceItem, required: true },
    batchAdded: { type: Boolean, default: false },
  },
  emits: ['toggleModal', 'runSinvFormulas', 'selectedRow', 'applyPricingRule'],

  setup() {
    return {
      isDiscountingEnabled: inject('isDiscountingEnabled') as boolean,
      itemSerialNumbers: inject('itemSerialNumbers') as {
        [item: string]: string;
      },
    };
  },
  data() {
    return {
      isExapanded: false,
      batches: [] as string[],
      availableQtyInBatch: 0,
      itemVisibility: '',

      defaultRate: this.row.rate as Money,
    };
  },
  watch: {
    'row.batch': {
      async handler(newBatch) {
        if (newBatch) {
          this.availableQtyInBatch = await this.getAvailableQtyInBatch();
          this.isExapanded = true;
        }
      },
      immediate: true,
    },
  },
  computed: {
    isUOMConversionEnabled(): boolean {
      return !!fyo.singles.InventorySettings?.enableUomConversions;
    },
    hasSerialNumber(): boolean {
      return !!(this.row.links?.item && this.row.links?.item.hasSerialNumber);
    },
    isReadOnly() {
      return this.row.isFreeItem;
    },
  },
  methods: {
    handleOpenKeyboard(row: SalesInvoiceItem, field: string) {
      if (this.isReadOnly) {
        return;
      }

      this.$emit('selectedRow', row, field);
      this.$emit('toggleModal', 'Keyboard');
    },
    async getAvailableQtyInBatch(): Promise<number> {
      if (!this.row.batch) {
        return 0;
      }

      return (
        (await fyo.db.getStockQuantity(
          this.row.item as string,
          undefined,
          undefined,
          undefined,
          this.row.batch
        )) ?? 0
      );
    },
    async setBatch(batch: string) {
      this.row.set('batch', batch);
      this.availableQtyInBatch = await this.getAvailableQtyInBatch();
    },
    setSerialNumber(serialNumber: string) {
      if (!serialNumber) {
        return;
      }
      this.itemSerialNumbers[this.row.item as string] = serialNumber;

      validateSerialNumberCount(
        serialNumber,
        this.row.quantity ?? 0,
        this.row.item!
      );
    },
    async removeAddedItem(row: SalesInvoiceItem) {
      this.row.parentdoc?.remove('items', row?.idx as number);

      if (!row.isFreeItem) {
        this.$emit('applyPricingRule');
      }
    },
  },
});
</script>
