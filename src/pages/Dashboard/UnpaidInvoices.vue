<template>
  <div class="flex -mx-4">
    <div class="w-1/2 px-4" v-for="invoice in invoices" :key="invoice.title">
      <SectionHeader>
        <template slot="title">{{ invoice.title }}</template>
        <PeriodSelector
          slot="action"
          :value="$data[invoice.periodKey]"
          @change="value => ($data[invoice.periodKey] = value)"
        />
      </SectionHeader>
      <div class="mt-6 flex justify-between">
        <div class="text-sm">
          {{ frappe.format(invoice.paid, 'Currency') }}
          <span class="text-gray-600">{{ _('Paid') }}</span>
        </div>
        <div class="text-sm">
          {{ frappe.format(invoice.unpaid, 'Currency') }}
          <span class="text-gray-600">{{ _('Unpaid') }}</span>
        </div>
      </div>
      <div class="mt-2 relative">
        <div
          class="w-full h-4 rounded"
          :class="invoice.color == 'blue' ? 'bg-blue-200' : 'bg-gray-200'"
        ></div>
        <div
          class="absolute inset-0 h-4 rounded"
          :class="invoice.color == 'blue' ? 'bg-blue-500' : 'bg-gray-500'"
          :style="`width: ${(invoice.paid / invoice.total) * 100}%`"
        ></div>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';

export default {
  name: 'UnpaidInvoices',
  components: {
    PeriodSelector,
    SectionHeader
  },
  data: () => ({
    invoices: [],
    salesInvoicePeriod: 'This Year',
    purchaseInvoicePeriod: 'This Year'
  }),
  watch: {
    salesInvoicePeriod: 'calculateInvoiceTotals',
    purchaseInvoicePeriod: 'calculateInvoiceTotals'
  },
  mounted() {
    this.calculateInvoiceTotals();
  },
  methods: {
    async calculateInvoiceTotals() {
      let promises = [
        {
          title: 'Sales Invoices',
          doctype: 'SalesInvoice',
          total: 0,
          unpaid: 0,
          paid: 0,
          color: 'blue',
          periodKey: 'salesInvoicePeriod'
        },
        {
          title: 'Purchase Invoices',
          doctype: 'PurchaseInvoice',
          total: 0,
          unpaid: 0,
          paid: 0,
          color: 'gray',
          periodKey: 'purchaseInvoicePeriod'
        }
      ].map(async d => {
        let { fromDate, toDate, periodicity } = await getDatesAndPeriodicity(
          this.$data[d.periodKey]
        );

        let res = await frappe.db.sql(
          `
          select
            sum(baseGrandTotal) as total,
            sum(outstandingAmount) as outstanding
          from ${d.doctype}
          where date >= $fromDate and date <= $toDate
        `,
          { $fromDate: fromDate, $toDate: toDate }
        );
        let { total, outstanding } = res[0];
        d.total = total;
        d.unpaid = outstanding;
        d.paid = total - outstanding;
        return d;
      });

      this.invoices = await Promise.all(promises);
    }
  }
};
</script>
