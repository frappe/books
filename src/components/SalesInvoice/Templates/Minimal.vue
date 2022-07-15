<template>
  <div
    class="bg-white border h-full"
    :style="{ 'font-family': printSettings.font }"
  >
    <div class="flex items-center justify-between px-12 py-10 border-b">
      <div class="flex items-center">
        <div class="flex items-center rounded h-16">
          <div class="mr-4" v-if="printSettings.displayLogo">
            <img
              class="h-12 max-w-32 object-contain"
              :src="printSettings.logo"
            />
          </div>
        </div>
        <div>
          <div
            class="font-semibold text-xl"
            :style="{ color: printSettings.color }"
          >
            {{ fyo.singles.AccountingSettings.companyName }}
          </div>
          <div>
            {{ fyo.format(doc.date, 'Date') }}
          </div>
        </div>
      </div>
      <div class="text-right">
        <div
          class="font-semibold text-xl"
          :style="{ color: printSettings.color }"
        >
          {{
            doc.schemaName === 'SalesInvoice'
              ? t`Sales Invoice`
              : t`Purchase Invoice`
          }}
        </div>
        <div>
          {{ doc.name }}
        </div>
      </div>
    </div>
    <div class="flex px-12 py-10 border-b">
      <div class="w-1/2" v-if="party">
        <div
          class="uppercase text-sm font-semibold tracking-widest text-gray-800"
        >
          {{ isSalesInvoice ? 'To' : 'From' }}
        </div>
        <div class="mt-4 text-black leading-relaxed text-lg">
          {{ party.name }} <br />
          {{ partyAddress ? partyAddress : '' }}
        </div>
        <div
          class="mt-4 text-black leading-relaxed text-lg"
          v-if="party && party.gstin"
        >
          GSTIN: {{ party.gstin }}
        </div>
      </div>
      <div class="w-1/2" v-if="companyAddress">
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
          {{ isSalesInvoice ? 'From' : 'To' }}
        </div>
        <div class="mt-4 ml-8 text-black leading-relaxed text-lg">
          {{ companyAddress.addressDisplay }}
        </div>
        <div
          class="mt-4 ml-8 text-black leading-relaxed text-lg"
          v-if="
            fyo.singles.AccountingSettings &&
            fyo.singles.AccountingSettings.gstin
          "
        >
          GSTIN: {{ fyo.singles.AccountingSettings.gstin }}
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
        <div class="w-2/12 text-right" v-if="showHSN">HSN/SAC</div>
        <div class="w-2/12 text-right">Quantity</div>
        <div class="w-3/12 text-right">Rate</div>
        <div class="w-3/12 text-right">Amount</div>
      </div>
      <div class="flex py-1 text-lg" v-for="row in doc.items" :key="row.name">
        <div class="w-4/12">{{ row.item }}</div>
        <div class="w-2/12 text-right" v-if="showHSN">{{ row.hsnCode }}</div>
        <div class="w-2/12 text-right">{{ format(row, 'quantity') }}</div>
        <div class="w-3/12 text-right">{{ format(row, 'rate') }}</div>
        <div class="w-3/12 text-right">{{ format(row, 'amount') }}</div>
      </div>
    </div>
    <div class="flex px-12 py-10">
      <div class="w-1/2" v-if="doc.terms">
        <div
          class="uppercase text-sm tracking-widest font-semibold text-gray-800"
        >
          Notes
        </div>
        <div class="mt-4 text-lg whitespace-pre-line">
          {{ doc.terms }}
        </div>
      </div>
      <div class="w-1/2 text-lg">
        <div class="flex pl-2 justify-between py-1">
          <div>{{ t`Subtotal` }}</div>
          <div>{{ fyo.format(doc.netTotal, 'Currency') }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-if="totalDiscount?.float > 0 && !doc.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ `- ${fyo.format(totalDiscount, 'Currency')}` }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-for="tax in doc.taxes"
          :key="tax.name"
        >
          <div>{{ tax.account }}</div>
          <div>{{ fyo.format(tax.amount, 'Currency') }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-if="totalDiscount?.float > 0 && doc.discountAfterTax"
        >
          <div>{{ t`Discount` }}</div>
          <div>{{ `- ${fyo.format(totalDiscount, 'Currency')}` }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1 font-semibold"
          :style="{ color: printSettings.color }"
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
  name: 'Minimal',
  extends: Base,
};
</script>
