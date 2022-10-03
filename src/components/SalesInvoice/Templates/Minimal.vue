<template>
  <div
    class="bg-white border h-full"
    :style="{ 'font-family': printObject.font }"
  >
    <div class="flex items-center justify-between px-12 py-10 border-b">
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
          <div>
            {{ printObject.date }}
          </div>
        </div>
      </div>
      <div class="text-right">
        <div
          class="font-semibold text-xl"
          :style="{ color: printObject.color }"
        >
          {{
            printObject.isSalesInvoice ? t`Sales Invoice` : t`Purchase Invoice`
          }}
        </div>
        <div>
          {{ printObject.invoiceName }}
        </div>
      </div>
    </div>
    <div class="flex px-12 py-10 border-b">
      <div class="w-1/2" v-if="printObject.partyName">
        <div
          class="uppercase text-sm font-semibold tracking-widest text-gray-800"
        >
          {{ printObject.isSalesInvoice ? 'To' : 'From' }}
        </div>
        <div class="mt-4 text-black leading-relaxed text-lg">
          {{ printObject.partyName }} <br />
          {{ printObject.partyAddress ?? '' }}
        </div>
        <div
          class="mt-4 text-black leading-relaxed text-lg"
          v-if="printObject.partyGSTIN"
        >
          GSTIN: {{ printObject.partyGSTIN }}
        </div>
      </div>
      <div class="w-1/2" v-if="printObject.address">
        <div
          class="
            uppercase
            text-sm
            font-semibold
            tracking-widest
            text-gray-800
            ml-8
          "
        >
          {{ printObject.isSalesInvoice ? 'From' : 'To' }}
        </div>
        <div class="mt-4 ml-8 text-black leading-relaxed text-lg">
          {{ printObject.address }}
        </div>
        <div
          class="mt-4 ml-8 text-black leading-relaxed text-lg"
          v-if="printObject.gstin"
        >
          GSTIN: {{ printObject.gstin }}
        </div>
      </div>
    </div>
    <div class="px-12 py-10 border-b">
      <div
        class="
          mb-4
          flex
          uppercase
          text-sm
          tracking-widest
          font-semibold
          text-gray-800
        "
      >
        <div class="w-4/12">Item</div>
        <div class="w-2/12 text-right" v-if="printObject.showHSN">HSN/SAC</div>
        <div class="w-2/12 text-right">Quantity</div>
        <div class="w-3/12 text-right">Rate</div>
        <div class="w-3/12 text-right">Amount</div>
      </div>
      <div
        class="flex py-1 text-lg"
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
    </div>
    <div class="flex px-12 py-10">
      <div class="w-1/2" v-if="printObject.terms">
        <div
          class="uppercase text-sm tracking-widest font-semibold text-gray-800"
        >
          Notes
        </div>
        <div class="mt-4 text-lg whitespace-pre-line">
          {{ printObject.terms }}
        </div>
      </div>
      <div class="w-1/2 text-lg">
        <div class="flex pl-2 justify-between py-1">
          <div>{{ t`Subtotal` }}</div>
          <div>{{ printObject.netTotal }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-if="printObject.totalDiscount && !printObject.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ printObject.totalDiscount }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-for="tax in printObject.taxes"
          :key="tax.name"
        >
          <div>{{ tax.account }}</div>
          <div>{{ tax.amount }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-if="printObject.totalDiscount && printObject.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ printObject.totalDiscount }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1 font-semibold"
          :style="{ color: printObject.color }"
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
  name: 'Minimal',
  extends: BaseTemplate,
};
</script>
