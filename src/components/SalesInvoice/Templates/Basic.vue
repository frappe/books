<template>
  <div
    class="bg-white border h-full"
    :style="{ 'font-family': printObject.font }"
  >
    <div>
      <div class="px-6 pt-6">
        <div class="flex text-sm text-gray-900 border-b pb-4">
          <div class="w-1/3">
            <div v-if="printObject.displayLogo">
              <img
                class="h-12 max-w-32 object-contain"
                :src="printObject.logo"
              />
            </div>
            <div class="text-xl text-gray-700 font-semibold" v-else>
              {{ printObject.companyName }}
            </div>
          </div>
          <div class="w-1/3">
            <div>{{ printObject.email }}</div>
            <div class="mt-1">{{ printObject.phone }}</div>
          </div>
          <div class="w-1/3">
            <div v-if="printObject.address">
              {{ printObject.address }}
            </div>
            <div v-if="printObject.gstin">GSTIN: {{ printObject.gstin }}</div>
          </div>
        </div>
      </div>
      <div class="mt-8 px-6">
        <div class="flex justify-between">
          <div class="w-1/3">
            <h1 class="text-2xl font-semibold">
              {{ printObject.invoiceName }}
            </h1>
            <div class="py-2 text-base">
              {{ printObject.date }}
            </div>
          </div>
          <div class="w-1/3" v-if="printObject.partyName">
            <div class="py-1 text-right text-lg font-semibold">
              {{ printObject.partyName }}
            </div>
            <div
              v-if="printObject.partyAddress"
              class="mt-1 text-xs text-gray-600 text-right"
            >
              {{ printObject.partyAddress }}
            </div>
            <div
              v-if="printObject.partyGSTIN"
              class="mt-1 text-xs text-gray-600 text-right"
            >
              GSTIN: {{ printObject.partyGSTIN }}
            </div>
          </div>
        </div>
      </div>
      <div class="mt-2 px-6 text-base">
        <div>
          <div class="text-gray-600 w-full flex border-b">
            <div class="py-4 w-5/12">Item</div>
            <div class="py-4 text-right w-2/12" v-if="printObject.showHSN">
              HSN/SAC
            </div>
            <div class="py-4 text-right w-1/12">Quantity</div>
            <div class="py-4 text-right w-3/12">Rate</div>
            <div class="py-4 text-right w-3/12">Amount</div>
          </div>
          <div
            class="flex py-1 text-gray-900 w-full border-b"
            v-for="row in printObject.items"
            :key="row.name"
          >
            <div class="w-5/12 py-4">{{ row.item }}</div>
            <div class="w-2/12 text-right py-4" v-if="printObject.showHSN">
              {{ row.hsnCode }}
            </div>
            <div class="w-1/12 text-right py-4">{{ row.quantity }}</div>
            <div class="w-3/12 text-right py-4">{{ row.rate }}</div>
            <div class="w-3/12 text-right py-4">{{ row.amount }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="px-6 mt-2 flex justify-end text-base">
      <div class="w-1/2">
        <div
          class="text-sm tracking-widest text-gray-600 mt-2"
          v-if="printObject.terms"
        >
          Notes
        </div>
        <div class="my-4 text-lg whitespace-pre-line">
          {{ printObject.terms }}
        </div>
      </div>
      <div class="w-1/2">
        <div class="flex pl-2 justify-between py-3 border-b">
          <div>{{ t`Subtotal` }}</div>
          <div>{{ printObject.netTotal }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-3 border-b"
          v-if="printObject.totalDiscount && !printObject.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ printObject.totalDiscount }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-3"
          v-for="tax in printObject.taxes"
          :key="tax.name"
        >
          <div>{{ tax.account }}</div>
          <div>{{ tax.amount }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-3 border-t"
          v-if="printObject.totalDiscount && printObject.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ printObject.totalDiscount }}</div>
        </div>
        <div
          class="
            flex
            pl-2
            justify-between
            py-3
            border-t
            text-green-600
            font-semibold
            text-base
          "
        >
          <div>{{ t`Grand Total` }}</div>
          <div>{{ printObject.grandTotal }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseTemplate from './BaseTemplate.vue';

export default {
  name: 'Default',
  extends: BaseTemplate,
};
</script>
