<template>
  <div class="overflow-hidden h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`">
      <div
        class="
          border
          rounded
          bg-gray-50
          focus-within:bg-gray-100
          flex
          items-center
        "
      >
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Year', 'This Quarter', 'This Month']"
          @change="(value) => (period = value)"
        />
      </div>
    </PageHeader>

    <div class="no-scrollbar overflow-auto h-full">
      <div
        style="min-width: var(--w-desk-fixed); min-height: var(--h-app)"
        class="overflow-auto"
      >
        <Cashflow
          class="p-4"
          :common-period="period"
          @period-change="handlePeriodChange"
        />
        <hr />
        <div class="flex w-full">
          <UnpaidInvoices
            :schema-name="'SalesInvoice'"
            :common-period="period"
            @period-change="handlePeriodChange"
            class="border-e"
          />
          <UnpaidInvoices
            :schema-name="'PurchaseInvoice'"
            :common-period="period"
            @period-change="handlePeriodChange"
          />
        </div>
        <hr />
        <div class="flex">
          <ProfitAndLoss
            class="w-full p-4 border-e"
            :common-period="period"
            @period-change="handlePeriodChange"
          />
          <Expenses
            class="w-full p-4"
            :common-period="period"
            @period-change="handlePeriodChange"
          />
        </div>
        <hr />
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
