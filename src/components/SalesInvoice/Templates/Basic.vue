<template>
  <div
    class="bg-white border h-full"
    :style="{ 'font-family': printSettings.font }"
  >
    <div>
      <div class="px-6 pt-6" v-if="printSettings">
        <div class="flex text-sm text-gray-900 border-b pb-4">
          <div class="w-1/3">
            <div v-if="printSettings.displayLogo">
              <img
                class="h-12 max-w-32 object-contain"
                :src="printSettings.logo"
              />
            </div>
            <div class="text-xl text-gray-700 font-semibold" v-else>
              {{ fyo.singles.AccountingSettings.companyName }}
            </div>
          </div>
          <div class="w-1/3">
            <div>{{ printSettings.email }}</div>
            <div class="mt-1">{{ printSettings.phone }}</div>
          </div>
          <div class="w-1/3">
            <div v-if="companyAddress">{{ companyAddress.addressDisplay }}</div>
            <div
              v-if="
                fyo.singles.AccountingSettings &&
                fyo.singles.AccountingSettings.gstin
              "
            >
              GSTIN: {{ fyo.singles.AccountingSettings.gstin }}
            </div>
          </div>
        </div>
      </div>
      <div class="mt-8 px-6">
        <div class="flex justify-between">
          <div class="w-1/3">
            <h1 class="text-2xl font-semibold">
              {{ doc.name }}
            </h1>
            <div class="py-2 text-base">
              {{ fyo.format(doc.date, 'Date') }}
            </div>
          </div>
          <div class="w-1/3" v-if="party">
            <div class="py-1 text-right text-lg font-semibold">
              {{ party.name }}
            </div>
            <div
              v-if="partyAddress"
              class="mt-1 text-xs text-gray-600 text-right"
            >
              {{ partyAddress }}
            </div>
            <div
              v-if="party && party.gstin"
              class="mt-1 text-xs text-gray-600 text-right"
            >
              GSTIN: {{ party.gstin }}
            </div>
          </div>
        </div>
      </div>
      <div class="mt-2 px-6 text-base">
        <div>
          <div class="text-gray-600 w-full flex border-b">
            <div class="py-4 w-5/12">Item</div>
            <div class="py-4 text-right w-2/12" v-if="showHSN">HSN/SAC</div>
            <div class="py-4 text-right w-1/12">Quantity</div>
            <div class="py-4 text-right w-3/12">Rate</div>
            <div class="py-4 text-right w-3/12">Amount</div>
          </div>
          <div
            class="flex py-1 text-gray-900 w-full border-b"
            v-for="row in doc.items"
            :key="row.name"
          >
            <div class="w-5/12 py-4">{{ row.item }}</div>
            <div class="w-2/12 text-right py-4" v-if="showHSN">
              {{ row.hsnCode }}
            </div>
            <div class="w-1/12 text-right py-4">
              {{ format(row, 'quantity') }}
            </div>
            <div class="w-3/12 text-right py-4">{{ format(row, 'rate') }}</div>
            <div class="w-3/12 text-right py-4">
              {{ format(row, 'amount') }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="px-6 mt-2 flex justify-end text-base">
      <div class="w-1/2 bg-pink">
        <div class="text-sm tracking-widest text-gray-600 mt-2">Notes</div>
        <div class="my-4 text-lg whitespace-pre-line">
          {{ doc.terms }}
        </div>
      </div>
      <div class="w-1/2">
        <div class="flex pl-2 justify-between py-3 border-b">
          <div>{{ t`Subtotal` }}</div>
          <div>{{ fyo.format(doc.netTotal, 'Currency') }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-3 border-b"
          v-if="totalDiscount?.float > 0 && !doc.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ `- ${fyo.format(totalDiscount, 'Currency')}` }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-3"
          v-for="tax in doc.taxes"
          :key="tax.name"
        >
          <div>{{ tax.account }}</div>
          <div>{{ fyo.format(tax.amount, 'Currency') }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-3 border-t"
          v-if="totalDiscount?.float > 0 && doc.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ `- ${fyo.format(totalDiscount, 'Currency')}` }}</div>
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
          <div>{{ fyo.format(doc.grandTotal, 'Currency') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Base from './BaseTemplate.vue';

export default {
  name: 'Default',
  extends: Base,
  props: ['doc', 'printSettings'],
};
</script>
