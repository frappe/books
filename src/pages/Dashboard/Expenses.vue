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
      <div class="w-1/2 flex flex-col gap-4 justify-center">
        <!-- Ledgend Item -->
        <div
          class="flex items-center text-sm"
          v-for="(d, i) in expenses"
          :key="d.name"
          @mouseover="active = i"
          @mouseleave="active = null"
        >
          <div class="w-3 h-3 rounded-sm flex-shrink-0" :class="d.class" />
          <p class="ms-2 overflow-x-auto whitespace-nowrap no-scrollbar w-28">
            {{ d.account }}
          </p>
          <p class="whitespace-nowrap flex-shrink-0 ms-auto">
            {{ fyo.format(d?.total ?? 0, 'Currency') }}
          </p>
        </div>
      </div>
      <DonutChart
        class="w-1/2 my-auto"
        :active="active"
        :sectors="sectors"
        :offset-x="3"
        :thickness="10"
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
import { truncate } from 'lodash';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import DonutChart from '../../components/Charts/DonutChart.vue';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

export default {
  name: 'Expenses',
  extends: DashboardChartBase,
  components: {
    DonutChart,
    PeriodSelector,
    SectionHeader,
  },
  data: () => ({
    active: null,
    expenses: [],
  }),
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
        label: truncate(account, { length: 21 }),
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
        { class: 'bg-pink-500', hex: uicolors.pink['500'] },
        { class: 'bg-pink-400', hex: uicolors.pink['400'] },
        { class: 'bg-pink-300', hex: uicolors.pink['300'] },
        { class: 'bg-pink-200', hex: uicolors.pink['200'] },
        { class: 'bg-pink-100', hex: uicolors.pink['100'] },
      ];

      topExpenses = topExpenses
        .filter((e) => e.total > 0)
        .map((d, i) => {
          d.color = shades[i].hex;
          d.class = shades[i].class;
          return d;
        });

      this.expenses = topExpenses;
    },
  },
};
</script>
