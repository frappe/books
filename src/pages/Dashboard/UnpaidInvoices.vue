<template>
  <div class="flex justify-between gap-10">
    <div
      class="w-1/2  flex flex-col justify-between"
      v-for="invoice in invoices"
      :key="invoice.title"
    >
      <SectionHeader>
        <template slot="title">{{ invoice.title }}</template>
        <PeriodSelector
          v-if="invoice.hasData"
          slot="action"
          :value="$data[invoice.periodKey]"
          @change="(value) => ($data[invoice.periodKey] = value)"
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
            class="text-sm bold"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.hasData }"
          >
            {{ frappe.format(invoice.paid, 'Currency') }}
            <span :class="{ 'text-gray-900': invoice.hasData }">{{
              t('Paid')
            }}</span>
          </div>
          <div
            class="text-sm"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.hasData }"
          >
            {{ frappe.format(invoice.unpaid, 'Currency') }}
            <span :class="{ 'text-gray-900': invoice.hasData }">{{
              t('Unpaid')
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
import frappe from 'frappe';
import Button from '@/components/Button';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';
import { routeTo } from '@/utils';

export default {
  name: 'UnpaidInvoices',
  components: {
    PeriodSelector,
    SectionHeader,
    Button,
  },
  data: () => ({
    invoices: [
      {
        title: 'Invoices',
        doctype: 'SalesInvoice',
        total: 0,
        unpaid: 0,
        paid: 0,
        color: 'blue',
        periodKey: 'salesInvoicePeriod',
        hasData: false,
        barWidth: 40,
      },
      {
        title: 'Bills',
        doctype: 'PurchaseInvoice',
        total: 0,
        unpaid: 0,
        paid: 0,
        color: 'gray',
        periodKey: 'purchaseInvoicePeriod',
        hasData: false,
        barWidth: 60,
      },
    ],
    salesInvoicePeriod: 'This Year',
    purchaseInvoicePeriod: 'This Year',
  }),
  watch: {
    salesInvoicePeriod: 'calculateInvoiceTotals',
    purchaseInvoicePeriod: 'calculateInvoiceTotals',
  },
  activated() {
    this.calculateInvoiceTotals();
  },
  methods: {
    async calculateInvoiceTotals() {
      let promises = this.invoices.map(async (d) => {
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
        d.total = total ?? 0;
        d.unpaid = outstanding ?? 0;
        d.paid = total - outstanding;
        d.hasData = d.total !== 0;
        d.barWidth = (d.paid / (d.total || 1)) * 100;
        return d;
      });

      this.invoices = await Promise.all(promises);
    },
    async newInvoice(invoice) {
      let doc = await frappe.getNewDoc(invoice.doctype);
      routeTo(`/edit/${invoice.doctype}/${doc.name}`);
    },
  },
};
</script>
