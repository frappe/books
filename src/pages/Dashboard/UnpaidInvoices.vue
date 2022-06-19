<template>
  <div class="flex">
    <div
      v-for="(invoice, i) in invoices"
      class="flex-col justify-between w-full p-4"
      :class="i === 0 ? 'border-r' : ''"
      :key="invoice.title"
    >
      <!-- Title and Period Selector -->
      <SectionHeader>
        <template #title>{{ invoice.title }}</template>
        <template #action>
          <PeriodSelector
            v-if="invoice.hasData"
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
      <div class="mt-4">
        <!-- Paid & Unpaid Amounts -->
        <div class="flex justify-between">
          <!-- Paid -->
          <div
            class="text-sm font-medium"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.count }"
          >
            {{ fyo.format(invoice.paid, 'Currency') }}
            <span :class="{ 'text-gray-900 font-normal': invoice.count }">{{
              t`Paid`
            }}</span>
          </div>

          <!-- Unpaid -->
          <div
            class="text-sm font-medium"
            :class="{ 'bg-gray-200 text-gray-200 rounded': !invoice.count }"
          >
            {{ fyo.format(invoice.unpaid, 'Currency') }}
            <span :class="{ 'text-gray-900 font-normal': invoice.count }">{{
              t`Unpaid`
            }}</span>
          </div>
        </div>

        <!-- Widget Bar -->
        <div
          class="mt-2 relative rounded overflow-hidden"
          @mouseenter="idx = i"
          @mouseleave="idx = -1"
        >
          <div
            class="w-full h-4"
            :class="
              invoice.count && invoice.color == 'blue'
                ? 'bg-blue-200'
                : invoice.hasData
                ? 'bg-pink-200'
                : 'bg-gray-200'
            "
          ></div>
          <div
            class="absolute inset-0 h-4"
            :class="
              invoice.count && invoice.color == 'blue'
                ? 'bg-blue-500'
                : invoice.hasData
                ? 'bg-pink-500'
                : 'bg-gray-400'
            "
            :style="`width: ${invoice.barWidth}%`"
          ></div>
        </div>
      </div>
    </div>
    <MouseFollower
      v-if="invoices[0].hasData || invoices[1].hasData"
      :offset="15"
      :show="idx >= 0"
      placement="top"
      class="text-sm shadow-md px-2 py-1 bg-white text-gray-900 border-l-4"
      :style="{ borderColor: colors[idx] }"
    >
      <div class="flex justify-between gap-4">
        <p>{{ t`Paid` }}</p>
        <p class="font-semibold">{{ invoices[idx]?.paidCount ?? 0 }}</p>
      </div>
      <div
        v-if="invoices[idx]?.unpaidCount > 0"
        class="flex justify-between gap-4"
      >
        <p>{{ t`Unpaid` }}</p>
        <p class="font-semibold">{{ invoices[idx]?.unpaidCount ?? 0 }}</p>
      </div>
    </MouseFollower>
  </div>
</template>
<script>
import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import MouseFollower from 'src/components/MouseFollower.vue';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { routeTo } from 'src/utils/ui';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

export default {
  name: 'UnpaidInvoices',
  components: {
    PeriodSelector,
    SectionHeader,
    Button,
    MouseFollower,
  },
  data: () => ({
    idx: -1,
    colors: [uicolors.blue['500'], uicolors.pink['500']],
    invoices: [
      {
        title: t`Sales Invoices`,
        schemaName: ModelNameEnum.SalesInvoice,
        total: 0,
        unpaid: 0,
        hasData: false,
        paid: 0,
        count: 0,
        unpaidCount: 0,
        paidCount: 0,
        color: 'blue',
        periodKey: 'salesInvoicePeriod',
        barWidth: 40,
      },
      {
        title: t`Purchase Invoices`,
        schemaName: ModelNameEnum.PurchaseInvoice,
        total: 0,
        unpaid: 0,
        hasData: false,
        paid: 0,
        count: 0,
        unpaidCount: 0,
        paidCount: 0,
        color: 'pink',
        periodKey: 'purchaseInvoicePeriod',
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
      for (const invoice of this.invoices) {
        const { fromDate, toDate } = await getDatesAndPeriodList(
          this.$data[invoice.periodKey]
        );

        const { total, outstanding } = await fyo.db.getTotalOutstanding(
          invoice.schemaName,
          fromDate.toISO(),
          toDate.toISO()
        );

        const { countTotal, countOutstanding } = await this.getCounts(
          invoice.schemaName,
          fromDate,
          toDate
        );

        invoice.total = total ?? 0;
        invoice.unpaid = outstanding ?? 0;
        invoice.paid = total - outstanding;
        invoice.hasData = countTotal > 0;
        invoice.count = countTotal;
        invoice.paidCount = countTotal - countOutstanding;
        invoice.unpaidCount = countOutstanding;
        invoice.barWidth = (invoice.paid / (invoice.total || 1)) * 100;
      }
    },
    async newInvoice(invoice) {
      let doc = await fyo.doc.getNewDoc(invoice.schemaName);
      routeTo(`/edit/${invoice.schemaName}/${doc.name}`);
    },

    async getCounts(schemaName, fromDate, toDate) {
      const outstandingAmounts = await fyo.db.getAllRaw(schemaName, {
        fields: ['outstandingAmount'],
        filters: {
          cancelled: false,
          submitted: true,
          date: ['<=', toDate.toISO(), '>=', fromDate.toISO()],
        },
      });

      const isOutstanding = outstandingAmounts.map((o) =>
        parseFloat(o.outstandingAmount)
      );

      return {
        countTotal: isOutstanding.length,
        countOutstanding: isOutstanding.filter((o) => o > 0).length,
      };
    },
  },
};
</script>
