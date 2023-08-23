<template>
  <feather-icon
    :name="isExapanded ? 'chevron-up' : 'chevron-down'"
    class="w-4 h-4 inline-flex"
    @click="isExapanded = !isExapanded"
  />

  <Link
    :df="{
      fieldname: 'item',
      fieldtype: 'Link',
      target: 'Item',
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
      fieldtype: 'Link',
      target: 'UOM',
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
        @change="(value) => (row.quantity = value)"
        :read-only="false"
      />
    </div>

    <div class="px-4 pt-6 col-span-2 flex">
      <Link
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
        @change="(value) => setTransferUnit((row.transferUnit = value))"
      />
      <feather-icon
        name="refresh-ccw"
        class="w-3.5 ml-2 mt-4 text-blue-500"
        @click="row.transferUnit = row.unit"
      />
    </div>

    <div class="px-4 pt-6 col-span-2">
      <Int
        :df="{
          fieldtype: 'Int',
          fieldname: 'transferQuantity',
          label: 'Transfer Quantity',
        }"
        size="medium"
        :border="true"
        :show-label="true"
        :value="row.transferQuantity"
        @change="(value) => setTransferQty((row.transferQuantity = value))"
        :read-only="false"
      />
    </div>

    <div v-show="row.links?.item.hasBatch" class="pl-6 px-4 pt-6 col-span-2">
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
        @change="(value) => setBatch(value)"
      />
    </div>

    <div v-show="!!row.links?.item.hasBatch" class="px-2 pt-6 col-span-2">
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

    <div
      v-show="!!row.links?.item.hasSerialNumber"
      class="px-2 pt-8 col-span-2"
    >
      <Text
        :df="{
          label: t`Serial Number`,
          fieldtype: 'Text',
          fieldname: 'serialNumber',
        }"
        :value="row.serialNumber"
        :show-label="true"
        :border="true"
        @change="(value:string)=> setSerialNumber(value)"
      />
    </div>

    <div class=""></div>

    <div class="px-4 pt-6 col-span-2 flex">
      <Currency
        :df="{
          fieldtype: 'Currency',
          fieldname: 'rate',
          label: 'Rate',
        }"
        class="col-span-2 flex-1"
        size="medium"
        :show-label="true"
        :border="true"
        :value="row.rate"
        :read-only="false"
        @change="(value) => (row.rate = value)"
      />
      <feather-icon
        name="refresh-ccw"
        class="w-3.5 ml-2 mt-5 text-blue-500"
        @click="row.rate= (defaultRate as Money)"
      />
    </div>

    <div class="px-6 pt-6 col-span-2">
      <Currency
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
        @change="(value) => setItemDiscount('amount', value)"
      />
    </div>

    <div class="px-4 pt-6">
      <Float
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
        @change="(value) => setItemDiscount('percent', value)"
      />
    </div>
  </template>
</template>

<script lang="ts">
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { Money } from 'pesa';
import { inject } from 'vue';
import { defineComponent } from 'vue';
import Data from '../Controls/Data.vue';
import Int from '../Controls/Int.vue';
import Currency from '../Controls/Currency.vue';
import Link from '../Controls/Link.vue';
import Text from '../Controls/Text.vue';
import Float from '../Controls/Float.vue';
import { fyo } from 'src/initFyo';
import { DiscountType } from './types';

export default defineComponent({
  name: 'SelectedItemRow',
  components: { Data, Int, Currency, Link, Text, Float },
  props: {
    row: { type: SalesInvoiceItem, required: true },
  },
  emits: ['removeItem', 'setItemSerialNumbers'],
  setup() {
    return {
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
    },
    setItemDiscount(type: DiscountType, value: Money | number) {
      if (type === DiscountType.Percent) {
        this.row.setItemDiscountAmount = false;
        this.row.itemDiscountPercent = value as number;
        return;
      }
      this.row.setItemDiscountAmount = true;
      this.row.itemDiscountAmount = value as Money;
    },
    setTransferUnit(unit: string) {
      this.row._validateFields();
      this.row.setTransferUnit = unit;
      this.row._applyFormula('transferUnit');
    },
    setTransferQty(quantity: number) {
      this.row._validateFields();
      this.row.transferQuantity = quantity;
      this.row._applyFormula('transferQuantity');
    },
  },
});
</script>
