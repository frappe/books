<template>
  <div
    class="bg-white border h-full"
    :style="{ 'font-family': printObject.font }"
  >
    <div class="bg-gray-100 px-12 py-10">
      <div class="flex items-center">
        <div class="flex items-center rounded h-16">
          <div class="mr-4" v-if="printObject.displayLogo">
            <img class="h-12 max-w-32 object-contain" :src="printObject.logo" />
          </div>
        </div>
        <div>
          <div
            class="font-semibold text-xl"
            :style="{ color: printObject.color }"
          >
            {{ printObject.companyName }}
          </div>
          <div class="text-sm text-gray-800" v-if="printObject.address">
            {{ printObject.address }}
          </div>
          <div class="text-sm text-gray-800" v-if="printObject.gstin">
            GSTIN: {{ printObject.gstin }}
          </div>
        </div>
      </div>
      <div class="mt-8 text-lg">
        <div class="flex">
          <div class="w-1/3 font-semibold">
            {{ printObject.isSalesInvoice ? 'Invoice' : 'Bill' }}
          </div>
          <div class="w-2/3 text-gray-800">
            <div class="font-semibold">
              {{ printObject.invoiceName }}
            </div>
            <div>
              {{ printObject.date }}
            </div>
          </div>
        </div>
        <div class="mt-4 flex">
          <div class="w-1/3 font-semibold">
            {{ printObject.isSalesInvoice ? 'Customer' : 'Supplier' }}
          </div>
          <div class="w-2/3 text-gray-800" v-if="printObject.partyName">
            <div class="font-semibold">
              {{ printObject.partyName }}
            </div>
            <div v-if="printObject.partyAddress">
              {{ printObject.partyAddress }}
            </div>
            <div v-if="printObject.partyGSTIN">
              GSTIN: {{ printObject.partyGSTIN }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="px-12 py-12 text-lg">
      <div class="mb-4 flex font-semibold">
        <div class="w-4/12">Item</div>
        <div class="w-2/12 text-right" v-if="printObject.showHSN">HSN/SAC</div>
        <div class="w-2/12 text-right">Quantity</div>
        <div class="w-3/12 text-right">Rate</div>
        <div class="w-3/12 text-right">Amount</div>
      </div>
      <div
        class="flex py-1 text-gray-800"
        v-for="row in printObject.items"
        :key="row.name"
      >
        <div class="w-4/12">{{ row.item }}</div>
        <div class="w-2/12 text-right" v-if="printObject.showHSN">
          {{ row.hsnCode }}
        </div>
        <div class="w-2/12 text-right">{{ row.quantity }}</div>
        <div class="w-3/12 text-right">{{ row.rate }}</div>
        <div class="w-3/12 text-right">{{ row.amount }}</div>
      </div>
      <div class="mt-12">
        <div class="flex -mx-3">
          <div class="flex justify-end flex-1 py-3 bg-gray-100 gap-8 pr-6">
            <div class="text-right">
              <div class="text-gray-800">{{ t`Subtotal` }}</div>
              <div class="text-xl mt-2">
                {{ printObject.netTotal }}
              </div>
            </div>

            <div
              class="text-right"
              v-if="printObject.totalDiscount && !printObject.discountAfterTax"
            >
              <div class="text-gray-800">{{ t`Discount` }}</div>
              <div class="text-xl mt-2">
                {{ printObject.totalDiscount }}
              </div>
            </div>

            <div
              class="text-right"
              v-for="tax in printObject.taxes"
              :key="tax.name"
            >
              <div class="text-gray-800">
                {{ tax.account }}
              </div>
              <div class="text-xl mt-2">
                {{ tax.amount }}
              </div>
            </div>

            <div
              class="text-right"
              v-if="printObject.totalDiscount && printObject.discountAfterTax"
            >
              <div class="text-gray-800">{{ t`Discount` }}</div>
              <div class="text-xl mt-2">
                {{ printObject.totalDiscount }}
              </div>
            </div>
          </div>
          <div
            class="py-3 px-4 text-right text-white"
            :style="{ backgroundColor: printObject.color }"
          >
            <div>
              <div>{{ t`Grand Total` }}</div>
              <div class="text-2xl mt-2 font-semibold">
                {{ printObject.grandTotal }}
              </div>
            </div>
          </div>
        </div>
        <div class="mt-12" v-if="printObject.terms">
          <div class="text-lg font-semibold">Notes</div>
          <div class="mt-4 text-lg whitespace-pre-line">
            {{ printObject.terms }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import BaseTemplate from './BaseTemplate.vue';

export default {
  name: 'Business',
  extends: BaseTemplate,
};
</script>
