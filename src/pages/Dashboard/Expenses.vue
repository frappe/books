<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Top Expenses` }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(value) => (period = value)" />
      </template>
    </SectionHeader>
    <div class="flex relative" v-show="hasData">
      <!-- Chart Legend -->
      <div class="w-1/2 flex flex-col gap-5 mt-8">
        <!-- Ledgend Item -->
        <div
          class="flex justify-between items-center text-sm"
          v-for="(d, i) in expenses"
          :key="d.name"
        >
          <div
            class="flex items-center"
            @mouseover="active = i"
            @mouseleave="active = null"
          >
            <div class="w-3 h-3 rounded-sm flex-shrink-0" :class="d.class" />
            <p
              class="ml-2 w-24 overflow-x-scroll whitespace-nowrap no-scrollbar"
            >
              {{ d.account }}
            </p>
          </div>
          <p class="whitespace-nowrap">
            {{ fyo.format(d.total, 'Currency') }}
          </p>
        </div>
      </div>
      <DonutChart
        class="w-1/2"
        :active="active"
        :sectors="sectors"
        :offset-x="3"
        :thickness="11.5"
        :text-offset-x="6.5"
        :value-formatter="(value) => fyo.format(value, 'Currency')"
        :total-label="t`Total Spending`"
        @change="(value) => (active = value)"
      />
    </div>

    <!-- Empty Message -->
    <div
      v-if="expenses.length === 0"
      class="flex-1 w-full h-full flex-center my-20"
    >
      <span class="text-base text-gray-600">
        {{ t`No expenses in this period` }}
      </span>
    </div>
  </div>
</template>

<script>
import { fyo } from 'src/initFyo';
import theme from 'src/theme';
import { getDatesAndPeriodList } from 'src/utils/misc';
import DonutChart from '../../components/Charts/DonutChart.vue';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';

export default {
  name: 'Expenses',
  components: {
    DonutChart,
    PeriodSelector,
    SectionHeader,
  },
  data: () => ({
    period: 'This Year',
    active: null,
    expenses: [],
  }),
  watch: {
    period(new_, old) {
      this.setData();
    },
  },
  activated() {
    this.setData();
  },
  computed: {
    totalExpense() {
      return this.expenses.reduce((sum, expense) => sum + expense.total, 0);
    },
    hasData() {
      return this.expenses.length > 0;
    },
    sectors() {
      return this.expenses.map(({ account, color, total }) => ({
        color,
        label: account,
        value: total,
      }));
    },
  },
  methods: {
    async setData() {
      const { fromDate, toDate } = await getDatesAndPeriodList(this.period);
      let topExpenses = await fyo.db.getTopExpenses(
        fromDate.toISO(),
        toDate.toISO()
      );

      const shades = [
        { class: 'bg-gray-800', hex: theme.backgroundColor.gray['800'] },
        { class: 'bg-gray-600', hex: theme.backgroundColor.gray['600'] },
        { class: 'bg-gray-400', hex: theme.backgroundColor.gray['400'] },
        { class: 'bg-gray-300', hex: theme.backgroundColor.gray['300'] },
        { class: 'bg-gray-200', hex: theme.backgroundColor.gray['200'] },
      ];

      topExpenses = topExpenses.map((d, i) => {
        d.color = shades[i].hex;
        d.class = shades[i].class;
        return d;
      });

      this.expenses = topExpenses;
    },
  },
};
</script>
