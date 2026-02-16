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
        <template v-if="period === 'Custom'">
          <FormControl
            class="ml-1 w-32"
            :df="fromDateDF"
            :value="fromDate"
            @change="(value) => handleDateChange('fromDate', value)"
          />
          <span class="mx-2 dark:text-gray-300 text-sm font-thin">to</span>
          <FormControl
            class="w-32"
            :df="toDateDF"
            :value="toDate"
            @change="(value) => handleDateChange('toDate', value)"
          />
        </template>
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="[
            'This Year',
            'This Quarter',
            'This Month',
            'YTD',
            'Custom',
          ]"
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
          :dark-mode="darkMode"
          :from-date="fromDate"
          :to-date="toDate"
          @period-change="handlePeriodChange"
        />
        <hr class="dark:border-gray-800" />
        <div class="flex w-full">
          <UnpaidInvoices
            :schema-name="'SalesInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            :from-date="fromDate"
            :to-date="toDate"
            class="border-e dark:border-gray-800"
            @period-change="handlePeriodChange"
          />
          <UnpaidInvoices
            :schema-name="'PurchaseInvoice'"
            :common-period="period"
            :dark-mode="darkMode"
            :from-date="fromDate"
            :to-date="toDate"
            @period-change="handlePeriodChange"
          />
        </div>
        <hr class="dark:border-gray-800" />
        <div class="flex">
          <ProfitAndLoss
            class="w-full p-4 border-e dark:border-gray-800"
            :common-period="period"
            :dark-mode="darkMode"
            :from-date="fromDate"
            :to-date="toDate"
            @period-change="handlePeriodChange"
          />
          <Expenses
            class="w-full p-4"
            :common-period="period"
            :dark-mode="darkMode"
            :from-date="fromDate"
            :to-date="toDate"
            @period-change="handlePeriodChange"
          />
        </div>
        <hr class="dark:border-gray-800" />
      </div>
    </div>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import Expenses from './Expenses.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import { docsPathRef } from 'src/utils/refs';
import FormControl from 'src/components/Controls/FormControl.vue';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
    FormControl,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      period: 'This Year',
      fromDate: DateTime.now().minus({ years: 1 }).toISODate(),
      toDate: DateTime.now().plus({ days: 1 }).toISODate(),

      fromDateDF: {
        fieldtype: 'Date',
        label: 'From Date',
        required: true,
      },
      toDateDF: {
        fieldtype: 'Date',
        label: 'To Date',
        required: true,
      },
    };
  },
  activated() {
    docsPathRef.value = 'books/dashboard';
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
    handleDateChange(type, value) {
      if (type === 'fromDate') {
        if (this.fromDate > this.toDate) {
          return;
        }
        this.fromDate = value;
      } else if (type === 'toDate') {
        this.toDate = value;
      }
    },
  },
};
</script>
