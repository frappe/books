<template>
  <div>
    <feather-icon
      :name="isExapanded ? 'chevron-up' : 'chevron-down'"
      class="w-4 h-4 inline-flex"
      @click="isExapanded = !isExapanded"
    />
  </div>

  <div class="relative" @click="isExapanded = !isExapanded">
    <Link
      :df="{
        fieldname: 'item',
        fieldtype: 'Data',
        label: 'item',
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
      label: 'Quantity',
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

  <div class="flex justify-center">
    <feather-icon
      name="trash"
      class="w-4 text-xl text-red-500"
      @click="removeAddedItem(row)"
    />
  </div>

  <div></div>

  <template v-if="isExapanded">
    <div class="rounded-md grid grid-cols-4 my-3" style="width: calc(27vw)">
      <div class="px-4 col-span-2">
        <Float
          :df="{
            fieldname: 'quantity',
            fieldtype: 'Float',
            label: 'Quantity',
          }"
          @click="handleOpenKeyboard(row)"
          size="medium"
          :min="0"
          :border="true"
          :show-label="true"
          :value="row.quantity"
          @change="(value:number) => setQuantity((row.quantity = value))"
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
          @change="(value:string) => row.set('transferUnit', value)"
          :read-only="isReadOnly"
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
          @change="(value:string) => row.set('transferQuantity', value)"
          :read-only="isReadOnly"
        />
      </div>
      <div class="px-4 pt-6 col-span-2">
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
          :read-only="isReadOnly"
          @change="(value:Money) => setRate((row.rate = value))"
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
          class="col-span-2"
          size="medium"
          :show-label="true"
          :border="true"
          :value="row.itemDiscountAmount"
          :read-only="row.itemDiscountPercent as number > 0 || isReadOnly"
          @change="(value:number) => setItemDiscount('amount', value)"
        />
      </div>

      <div class="px-4 col-span-2 mt-5">
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
          :read-only="!row.itemDiscountAmount?.isZero() || isReadOnly"
          @change="(value:number) => setItemDiscount('percent', value)"
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

      <div v-if="hasSerialNumber" class="px-2 pt-8 col-span-4">
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
import { DiscountType } from '../types';
import { validateSerialNumberCount } from 'src/utils/pos';
import { getPricingRule } from 'models/helpers';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { ApplicablePricingRules } from 'models/baseModels/Invoice/types';

export default defineComponent({
  name: 'ModernPOSSelectedItemRow',
  components: { Currency, Data, Float, Int, Link, Text },
  props: {
    row: { type: SalesInvoiceItem, required: true },
  },
  emits: ['toggleModal', 'runSinvFormulas', 'selectedItem'],

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
    isReadOnly() {
      return this.row.isFreeItem;
    },
  },
  methods: {
    handleOpenKeyboard(row: SalesInvoiceItem) {
      if (this.isReadOnly) {
        return;
      }
      this.$emit('selectedItem', row);
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
    setItemDiscount(type: DiscountType, value: Money | number) {
      if (type === 'percent') {
        this.row.set('setItemDiscountAmount', false);
        this.row.set('itemDiscountPercent', value as number);
        return;
      }
      this.row.set('setItemDiscountAmount', true);
      this.row.set('itemDiscountAmount', value as Money);
    },
    setRate(rate: Money) {
      this.row.setRate = rate;
      this.$emit('runSinvFormulas');
    },
    async setQuantity(quantity: number) {
      this.row.set('quantity', quantity);

      if (!this.row.isFreeItem) {
        await this.updatePricingRuleItem();
        this.$emit('runSinvFormulas');
      }
    },
    async removeAddedItem(row: SalesInvoiceItem) {
      this.row.parentdoc?.remove('items', row?.idx as number);

      if (!row.isFreeItem) {
        await this.updatePricingRuleItem();
      }
    },
    async updatePricingRuleItem() {
      const pricingRule = (await getPricingRule(
        this.row.parentdoc as SalesInvoice
      )) as ApplicablePricingRules[];

      let appliedPricingRuleCount =
        this.row.parentdoc?.pricingRuleDetail?.length;

      if (appliedPricingRuleCount !== pricingRule?.length) {
        appliedPricingRuleCount = pricingRule?.length;

        await this.row.parentdoc?.appendPricingRuleDetail(pricingRule);
        await this.row.parentdoc?.applyProductDiscount();
      }
    },
  },
});
</script>
