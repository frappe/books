<template>
  <div class="flex justify-between gap-10">
    <div
      class="flex-col justify-between flex-1"
      v-for="invoice in invoices"
      :key="invoice.title"
    >
      <!-- Title and Period Selector -->
      <SectionHeader>
        <template #title>{{ invoice.title }}</template>
        <template #action>
          <PeriodSelector
            v-if="invoice.count"
            :value="$data[invoice.periodKey]"
            @change="(value) => ($data[invoice.periodKey] = value)"
          />
          <Button
            v-else
            :icon="true"
            type="primary"
            @click="newInvoice(invoice)"
          >
            <feather-icon name="plus" class="w-4 h-4 text-white" />
          </Button>
        </template>
      </SectionHeader>

      <!-- Widget Body -->
      <div>
        <!-- Paid & Unpaid Amounts -->
        <div class="mt-6 flex justify-between">
          <!-- Paid -->
          <div
            class="text-sm bold"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.count }"
          >
            {{ fyo.format(invoice.paid, 'Currency') }}
            <span :class="{ 'text-gray-900': invoice.count }">{{
              t`Paid`
            }}</span>
          </div>

          <!-- Unpaid -->
          <div
            class="text-sm"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.count }"
          >
            {{ fyo.format(invoice.unpaid, 'Currency') }}
            <span :class="{ 'text-gray-900': invoice.count }">{{
              t`Unpaid`
            }}</span>
          </div>
        </div>

        <!-- Widget Bar -->
        <div class="mt-2 relative rounded overflow-hidden">
          <div
            class="w-full h-4"
            :class="
              invoice.count && invoice.color == 'blue'
                ? 'bg-blue-200'
                : 'bg-gray-200'
            "
          ></div>
          <div
            class="absolute inset-0 h-4"
            :class="
              invoice.count && invoice.color == 'blue'
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
import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import { fyo } from 'src/initFyo';
import { getDatesAndPeriodicity } from 'src/utils/misc';
import { routeTo } from 'src/utils/ui';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

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
        title: t`Sales Invoices`,
        schemaName: ModelNameEnum.SalesInvoice,
        total: 0,
        unpaid: 0,
        paid: 0,
        count: 0,
        color: 'blue',
        periodKey: 'salesInvoicePeriod',
        barWidth: 40,
      },
      {
        title: t`Purchase Invoices`,
        schemaName: ModelNameEnum.PurchaseInvoice,
        total: 0,
        unpaid: 0,
        paid: 0,
        count: 0,
        color: 'gray',
        periodKey: 'purchaseInvoicePeriod',
        barWidth: 60,
      },
    ],
    salesInvoicePeriod: 'This Month',
    purchaseInvoicePeriod: 'This Month',
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
      for (const invoice of this.invoices) {
        const { fromDate, toDate } = await getDatesAndPeriodicity(
          this.$data[invoice.periodKey]
        );

        const { total, outstanding } = await fyo.db.getTotalOutstanding(
          invoice.schemaName,
          fromDate,
          toDate
        );

        const count = await fyo.db.count(invoice.schemaName, {
          filters: { cancelled: false, submitted: true },
        });

        invoice.total = total ?? 0;
        invoice.unpaid = outstanding ?? 0;
        invoice.paid = total - outstanding;
        invoice.count = count;
        invoice.barWidth = (invoice.paid / (invoice.total || 1)) * 100;
      }
    },
    async newInvoice(invoice) {
      let doc = await fyo.doc.getNewDoc(invoice.schemaName);
      routeTo(`/edit/${invoice.schemaName}/${doc.name}`);
    },
  },
};
</script>
