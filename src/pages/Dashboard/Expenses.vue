<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Top Expenses` }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(value) => (period = value)" />
      </template>
    </SectionHeader>

    <div v-show="hasData" class="flex relative">
      <!-- Chart Legend -->
      <div class="w-1/2 flex flex-col gap-4 justify-center dark:text-gray-25">
        <!-- Legend Item -->
        <div
          v-for="(d, i) in expenses"
          :key="d.account"
          class="flex items-center text-sm"
          @mouseover="active = i"
          @mouseleave="active = null"
        >
          <div
            class="w-3 h-3 rounded-sm flex-shrink-0"
            :class="darkMode ? d.class.darkClass : d.class.class"
          />
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
        :value-formatter="(value: number) => fyo.format(value, 'Currency')"
        :total-label="t`Total Spending`"
        :dark-mode="darkMode"
        @change="(value: number) => (active = value)"
      />
    </div>

    <!-- Empty Message -->
    <div v-if="!hasData" class="flex-1 w-full h-full flex-center my-20">
      <span class="text-base text-gray-600 dark:text-gray-500">
        {{ t`No expenses in this period` }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { truncate } from 'lodash';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { defineComponent, PropType } from 'vue';
import DonutChart from '../../components/Charts/DonutChart.vue';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';
import { getDashboardDates } from 'src/utils/dashboardDateUtils';

interface Expense {
  account: string;
  total: number;
  color: { color: string; darkColor: string };
  class: { class: string; darkClass: string };
}

interface Sector {
  color: { color: string; darkColor: string };
  label: string;
  value: number;
}

export default defineComponent({
  name: 'Expenses',
  components: {
    DonutChart,
    PeriodSelector,
    SectionHeader,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
    fromDate: {
      type: [String, Date] as PropType<string | Date>,
      default: '',
    },
    toDate: {
      type: [String, Date] as PropType<string | Date>,
      default: '',
    },
  },
  data() {
    return {
      active: null as null | number,
      expenses: [] as Expense[],
    };
  },
  computed: {
    totalExpense(): number {
      const expenses = this.expenses as Expense[];
      return expenses.reduce((sum, expense) => sum + expense.total, 0);
    },
    hasData(): boolean {
      return (this.expenses as Expense[]).length > 0 && this.totalExpense > 0;
    },
    sectors(): Sector[] {
      return (this.expenses as Expense[]).map(
        ({ account, color, total }): Sector => ({
          color,
          label: truncate(account, { length: 21 }),
          value: total,
        })
      );
    },
  },
  watch: {
    period: 'setData',
    fromDate: 'setData',
    toDate: 'setData',
  },
  activated() {
    this.setData();
  },
  methods: {
    async setData() {
      try {
        const { fromDate, toDate } = getDashboardDates(
          this.period as string,
          this.fromDate as string | Date,
          this.toDate as string | Date
        );

        if (!fromDate.isValid || !toDate.isValid) {
          this.expenses = [];
          return;
        }

        const topExpenses: { account?: string; total?: number }[] =
          await fyo.db.getTopExpenses(fromDate.toISO(), toDate.toISO());

        const shades = [
          { class: 'bg-pink-500', hex: uicolors.pink['500'] },
          { class: 'bg-pink-400', hex: uicolors.pink['400'] },
          { class: 'bg-pink-300', hex: uicolors.pink['300'] },
          { class: 'bg-pink-200', hex: uicolors.pink['200'] },
          { class: 'bg-pink-100', hex: uicolors.pink['100'] },
        ];

        const darkShades = [
          { class: 'bg-pink-600', hex: uicolors.pink['600'] },
          { class: 'bg-pink-500', hex: uicolors.pink['500'] },
          { class: 'bg-pink-400', hex: uicolors.pink['400'] },
          { class: 'bg-pink-300', hex: uicolors.pink['300'] },
          {
            class: 'bg-pink-200 dark:bg-opacity-80',
            hex: uicolors.pink['200'] + 'CC',
          },
        ];

        let expenses: Expense[] = (topExpenses || [])
          .map((d, i) => {
            const shadeIndex = i % shades.length;
            return {
              account: d.account || 'Unknown',
              total: typeof d.total === 'number' ? d.total : 0,
              color: {
                color: shades[shadeIndex].hex,
                darkColor: darkShades[shadeIndex].hex,
              },
              class: {
                class: shades[shadeIndex].class,
                darkClass: darkShades[shadeIndex].class,
              },
            };
          })
          .filter((e) => e.total > 0);

        if (expenses.length === 0) {
          expenses = [
            {
              account: 'No Expenses',
              total: 1,
              color: { color: '#f4f4f6', darkColor: '#333' },
              class: { class: 'bg-gray-200', darkClass: 'bg-gray-700' },
            },
          ];
        }

        this.expenses = expenses;
      } catch {
        this.expenses = [
          {
            account: 'No Expenses',
            total: 1,
            color: { color: '#f4f4f6', darkColor: '#333' },
            class: { class: 'bg-gray-200', darkClass: 'bg-gray-700' },
          },
        ];
      }
    },
  },
});
</script>
