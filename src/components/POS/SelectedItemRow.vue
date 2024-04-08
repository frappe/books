<template>
  <feather-icon
    :name="isExapanded ? 'chevron-up' : 'chevron-down'"
    class="w-4 h-4 inline-flex"
    @click="isExapanded = !isExapanded"
  />

  <Link
    :df="{
      fieldname: 'item',
      fieldtype: 'Data',
      label: 'item',
    }"
    size="small"
    :border="false"
    :value="row.item"
    :read-only="true"
  />

  <Int
    :df="{
      fieldname: 'quantity',
      fieldtype: 'Int',
      label: 'Quantity',
    }"
    size="small"
    :border="false"
    :value="row.quantity"
    :read-only="true"
  />

  <Link
    :df="{
      fieldname: 'unit',
      fieldtype: 'Data',
      label: 'Unit',
    }"
    size="small"
    :border="false"
    :value="row.unit"
    :read-only="true"
  />

  <Currency
    :df="{
      fieldtype: 'Currency',
      fieldname: 'rate',
      label: 'rate',
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
      label: 'Amount',
    }"
    size="small"
    :border="false"
    :value="row.amount"
    :read-only="true"
  />

  <div class="px-4">
    <feather-icon
      name="trash"
      class="w-4 text-xl text-red-500"
      @click="$emit('removeItem', row.idx)"
    />
  </div>

  <div></div>

  <template v-if="isExapanded">
    <div class="px-4 pt-6 col-span-1">
      <Float
        :df="{
          fieldname: 'quantity',
          fieldtype: 'Float',
          label: 'Quantity',
        }"
        size="medium"
        :min="0"
        :border="true"
        :show-label="true"
        :value="row.quantity"
        @change="(value:number) => (row.quantity = value)"
        :read-only="false"
      />
    </div>

    <div class="px-4 pt-6 col-span-2 flex">
      <Link
        v-if="isUOMConversionEnabled"
        :df="{
          fieldname: 'transferUnit',
          fieldtype: 'Link',
          target: 'UOM',
          label: t`Transfer Unit`,
        }"
        class="flex-1"
        :show-label="true"
        :border="true"
        :value="row.transferUnit"
        @change="(value:string) => setTransferUnit((row.transferUnit = value))"
      />
      <feather-icon
        v-if="isUOMConversionEnabled"
        name="refresh-ccw"
        class="w-3.5 ml-2 mt-4 text-blue-500"
        @click="row.transferUnit = row.unit"
      />
    </div>

    <div class="px-4 pt-6 col-span-2">
      <Int
        v-if="isUOMConversionEnabled"
        :df="{
          fieldtype: 'Int',
          fieldname: 'transferQuantity',
          label: 'Transfer Quantity',
        }"
        size="medium"
        :border="true"
        :show-label="true"
        :value="row.transferQuantity"
        @change="(value:number) => setTransferQty((row.transferQuantity = value))"
        :read-only="false"
      />
    </div>

    <div></div>
    <div></div>

    <div class="px-4 pt-6 flex">
      <Currency
        :df="{
          fieldtype: 'Currency',
          fieldname: 'rate',
          label: 'Rate',
        }"
        size="medium"
        :show-label="true"
        :border="true"
        :value="row.rate"
        :read-only="false"
        @change="(value:Money) => (row.rate = value)"
      />
      <feather-icon
        name="refresh-ccw"
        class="w-3.5 ml-2 mt-5 text-blue-500 flex-none"
        @click="row.rate= (defaultRate as Money)"
      />
    </div>
    <div class="px-6 pt-6 col-span-2">
      <Currency
        v-if="isDiscountingEnabled"
        :df="{
          fieldtype: 'Currency',
          fieldname: 'discountAmount',
          label: 'Discount Amount',
        }"
        class="col-span-2"
        size="medium"
        :show-label="true"
        :border="true"
        :value="row.itemDiscountAmount"
        :read-only="row.itemDiscountPercent as number > 0"
        @change="(value:number) => setItemDiscount('amount', value)"
      />
    </div>

    <div class="px-4 pt-6 col-span-2">
      <Float
        v-if="isDiscountingEnabled"
        :df="{
          fieldtype: 'Float',
          fieldname: 'itemDiscountPercent',
          label: 'Discount Percent',
        }"
        size="medium"
        :show-label="true"
        :border="true"
        :value="row.itemDiscountPercent"
        :read-only="!row.itemDiscountAmount?.isZero()"
        @change="(value:number) => setItemDiscount('percent', value)"
      />
    </div>

    <div class=""></div>

    <div
      v-if="row.links?.item && row.links?.item.hasBatch"
      class="pl-6 px-4 pt-6 col-span-2"
    >
      <Link
        :df="{
          fieldname: 'batch',
          fieldtype: 'Link',
          target: 'Batch',
          label: t`Batch`,
        }"
        value=""
        :border="true"
        :show-label="true"
        :read-only="false"
        @change="(value:string) => setBatch(value)"
      />
    </div>

    <div
      v-if="row.links?.item && row.links?.item.hasBatch"
      class="px-2 pt-6 col-span-2"
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

    <div v-if="hasSerialNumber" class="px-2 pt-8 col-span-2">
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
  </template>
</template>

<script lang="ts">
import Currency from '../Controls/Currency.vue';
import Data from '../Controls/Data.vue';
import Float from '../Controls/Float.vue';
import Int from '../Controls/Int.vue';
import Link from '../Controls/Link.vue';
import Text from '../Controls/Text.vue';
import { inject } from 'vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { Money } from 'pesa';
import { DiscountType } from './types';
import { t } from 'fyo';
import { validateSerialNumberCount } from 'src/utils/pos';

export default defineComponent({
  name: 'SelectedItemRow',
  components: { Currency, Data, Float, Int, Link, Text },
  props: {
    row: { type: SalesInvoiceItem, required: true },
  },
  emits: ['removeItem', 'runSinvFormulas', 'setItemSerialNumbers'],
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

      defaultRate: this.row.rate as Money,
    };
  },
  computed: {
    isUOMConversionEnabled(): boolean {
      return !!fyo.singles.InventorySettings?.enableUomConversions;
    },
    hasSerialNumber(): boolean {
      return !!(this.row.links?.item && this.row.links?.item.hasSerialNumber);
    },
  },
  methods: {
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
      this.row.batch = batch;
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
    setItemDiscount(type: DiscountType, value: Money | number) {
      if (type === 'percent') {
        this.row.setItemDiscountAmount = false;
        this.row.itemDiscountPercent = value as number;
        this.$emit('runSinvFormulas');
        return;
      }
      this.row.setItemDiscountAmount = true;
      this.row.itemDiscountAmount = value as Money;
      this.$emit('runSinvFormulas');
    },
    setTransferUnit(unit: string) {
      this.row.setTransferUnit = unit;
      this.row._applyFormula('transferUnit');
    },
    setTransferQty(quantity: number) {
      this.row.transferQuantity = quantity;
      this.row._applyFormula('transferQuantity');
      this.$emit('runSinvFormulas');
    },
  },
});
</script>
