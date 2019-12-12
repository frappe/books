<template>
  <div class="flex -mx-4">
    <div
      class="w-1/2 px-4 flex flex-col justify-between"
      v-for="invoice in invoices"
      :key="invoice.title"
    >
      <SectionHeader>
        <template slot="title">{{ invoice.title }}</template>
        <PeriodSelector
          v-if="invoice.hasData"
          slot="action"
          :value="$data[invoice.periodKey]"
          @change="value => ($data[invoice.periodKey] = value)"
        />
        <Button
          v-else
          slot="action"
          :icon="true"
          type="primary"
          @click="newInvoice(invoice)"
        >
          <feather-icon name="plus" class="w-4 h-4 text-white" />
        </Button>
      </SectionHeader>
      <div>
        <div class="mt-6 flex justify-between">
          <div
            class="text-sm"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.hasData }"
          >
            {{ frappe.format(invoice.paid, 'Currency') }}
            <span :class="{ 'text-gray-600': invoice.hasData }">{{
              _('Paid')
            }}</span>
          </div>
          <div
            class="text-sm"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.hasData }"
          >
            {{ frappe.format(invoice.unpaid, 'Currency') }}
            <span :class="{ 'text-gray-600': invoice.hasData }">{{
              _('Unpaid')
            }}</span>
          </div>
        </div>
        <div class="mt-2 relative rounded overflow-hidden">
          <div
            class="w-full h-4"
            :class="
              invoice.hasData && invoice.color == 'blue'
                ? 'bg-blue-200'
                : 'bg-gray-200'
            "
          ></div>
          <div
            class="absolute inset-0 h-4"
            :class="
              invoice.hasData && invoice.color == 'blue'
                ? 'bg-blue-500'
                : 'bg-gray-500'
            "
            :style="`width: ${invoice.barWidth}%`"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Button from '@/components/Button';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';

export default {
  name: 'UnpaidInvoices',
  components: {
    PeriodSelector,
    SectionHeader,
    Button
  },
  data: () => ({
    invoices: [
      {
        title: 'Sales Invoices',
        doctype: 'SalesInvoice',
        total: 0,
        unpaid: 0,
        paid: 0,
        color: 'blue',
        periodKey: 'salesInvoicePeriod',
        hasData: false,
        barWidth: 40
      },
      {
        title: 'Purchase Invoices',
        doctype: 'PurchaseInvoice',
        total: 0,
        unpaid: 0,
        paid: 0,
        color: 'gray',
        periodKey: 'purchaseInvoicePeriod',
        hasData: false,
        barWidth: 60
      }
    ],
    salesInvoicePeriod: 'This Year',
    purchaseInvoicePeriod: 'This Year'
  }),
  watch: {
    salesInvoicePeriod: 'calculateInvoiceTotals',
    purchaseInvoicePeriod: 'calculateInvoiceTotals'
  },
  activated() {
    this.calculateInvoiceTotals();
  },
  methods: {
    async calculateInvoiceTotals() {
      let promises = this.invoices.map(async d => {
        let { fromDate, toDate } = await getDatesAndPeriodicity(
          this.$data[d.periodKey]
        );

        let result = await frappe.db
          .knex(d.doctype)
          .sum({ total: 'baseGrandTotal' })
          .sum({ outstanding: 'outstandingAmount' })
          .where('submitted', 1)
          .whereBetween('date', [fromDate, toDate])
          .first();

        let { total, outstanding } = result;
        d.total = total;
        d.unpaid = outstanding;
        d.paid = total - outstanding;
        d.hasData = (d.total || 0) !== 0;
        d.barWidth = (d.paid / d.total) * 100;
        return d;
      });

      this.invoices = await Promise.all(promises);
    },
    async newInvoice(invoice) {
      let doc = await frappe.getNewDoc(invoice.doctype);
      this.$router.push(`/edit/${invoice.doctype}/${doc.name}`);
    }
  }
};
</script>
