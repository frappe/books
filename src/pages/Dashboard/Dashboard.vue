<template>
  <div class="h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`">
      <div
        class="
          border
          dark:border-gray-900
          rounded
          bg-gray-50
          dark:bg-gray-890
          focus-within:bg-gray-100
          dark:focus-within:bg-gray-900
          flex
          items-center
        "
      >
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
          @change="(value) => (period = value)"
        />
      </div>
    </PageHeader>

    <div
      class="no-scrollbar overflow-auto dark:bg-gray-875"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div style="min-width: var(--w-desk-fixed)" class="overflow-auto">
        <Cashflow
          class="p-4"
          :common-period="period"
          :darkMode="darkMode"
          @period-change="handlePeriodChange"
        />
        <hr class="dark:border-gray-800" />
        <div class="flex w-full">
          <UnpaidInvoices
            :schema-name="'SalesInvoice'"
            :common-period="period"
            :darkMode="darkMode"
            class="border-e dark:border-gray-800"
            @period-change="handlePeriodChange"
          />
          <UnpaidInvoices
            :schema-name="'PurchaseInvoice'"
            :common-period="period"
            :darkMode="darkMode"
            @period-change="handlePeriodChange"
          />
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex">
          <ProfitAndLoss
            class="w-full p-4 border-e dark:border-gray-800"
            :common-period="period"
            :darkMode="darkMode"
            @period-change="handlePeriodChange"
          />
          <Expenses
            class="w-full p-4"
            :common-period="period"
            :darkMode="darkMode"
            @period-change="handlePeriodChange"
          />
        </div>
        <hr class="dark:border-gray-800" />
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import Expenses from './Expenses.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import { docsPathRef } from 'src/utils/refs';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return { period: 'This Year' };
  },
  activated() {
    docsPathRef.value = 'analytics/dashboard';
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    handlePeriodChange(period) {
      if (period === this.period) {
        return;
      }

      this.period = '';
    },
  },
};
</script>
