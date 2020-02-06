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
            {{ frappe.AccountingSettings.companyName }}
          </div>
          <div>
            {{ frappe.format(doc.date, 'Date') }}
          </div>
        </div>
      </div>
      <div class="text-right">
        <div
          class="font-semibold text-xl"
          :style="{ color: printSettings.color }"
        >
          {{ doc.doctype === 'SalesInvoice' ? 'Invoice' : 'Bill' }}
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
          To
        </div>
        <div class="mt-4 text-black leading-relaxed text-lg">
          {{ party.name }} <br />
          {{ party.addressDisplay }}
        </div>
      </div>
      <div class="w-1/2" v-if="companyAddress">
        <div
          class="uppercase text-sm font-semibold tracking-widest text-gray-800"
        >
          From
        </div>
        <div class="mt-4 text-black leading-relaxed text-lg">
          {{ companyAddress.addressDisplay }}
        </div>
      </div>
    </div>
    <div class="px-12 py-10 border-b">
      <div
        class="mb-4 flex uppercase text-sm tracking-widest font-semibold text-gray-800"
      >
        <div class="w-4/12">Item</div>
        <div class="w-2/12 text-right">Quantity</div>
        <div class="w-3/12 text-right">Rate</div>
        <div class="w-3/12 text-right">Amount</div>
      </div>
      <div class="flex py-1 text-lg" v-for="row in doc.items" :key="row.name">
        <div class="w-4/12">{{ row.item }}</div>
        <div class="w-2/12 text-right">{{ format(row, 'quantity') }}</div>
        <div class="w-3/12 text-right">{{ format(row, 'rate') }}</div>
        <div class="w-3/12 text-right">{{ format(row, 'amount') }}</div>
      </div>
    </div>
    <div class="flex px-12 py-10">
      <div class="w-1/2">
        <template v-if="doc.terms">
          <div
            class="uppercase text-sm tracking-widest font-semibold text-gray-800"
          >
            Notes
          </div>
          <div class="mt-4 text-lg whitespace-pre-line">
            {{ doc.terms }}
          </div>
        </template>
      </div>
      <div class="w-1/2 text-lg">
        <div class="flex pl-2 justify-between py-1">
          <div>{{ _('Subtotal') }}</div>
          <div>{{ frappe.format(doc.netTotal, 'Currency') }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1"
          v-for="tax in doc.taxes"
          :key="tax.name"
        >
          <div>{{ tax.account }} ({{ tax.rate }}%)</div>
          <div>{{ frappe.format(tax.amount, 'Currency') }}</div>
        </div>
        <div
          class="flex pl-2 justify-between py-1 font-semibold"
          :style="{ color: printSettings.color }"
        >
          <div>{{ _('Grand Total') }}</div>
          <div>{{ frappe.format(doc.grandTotal, 'Currency') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Base from './Base';

export default {
  name: 'Minimal',
  extends: Base
};
</script>
