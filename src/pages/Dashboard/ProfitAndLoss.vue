<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Profit and Loss` }}</template>
      <template #action>
        <PeriodSelector
          :value="period"
          :options="periodOptions"
          @change="(value) => (period = value)"
        />
      </template>
    </SectionHeader>
    <BarChart
      v-if="hasData"
      class="mt-4"
      :aspect-ratio="2.05"
      :colors="chartData.colors"
      :grid-color="chartData.gridColor"
      :font-color="chartData.fontColor"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :y-min="chartData.yMin"
    />
    <div v-else class="flex-1 w-full h-full flex-center my-20">
      <span class="text-base text-gray-600 dark:text-gray-500">
        {{ t`No transactions yet` }}
      </span>
    </div>
  </div>
</template>
<script lang="ts">
import { DateTime } from 'luxon';
import BarChart from 'src/components/Charts/BarChart.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax, getYMin } from 'src/utils/chart';
import { uicolors } from 'src/utils/colors';
import { getValueMapFromList } from 'utils';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';
import { defineComponent } from 'vue';
import { getDashboardDates } from 'src/utils/dashboardDateUtils';

// Linting broken in this file cause of `extends: ...`
/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return
*/
export default defineComponent({
  name: 'ProfitAndLoss',
  components: {
    PeriodSelector,
    SectionHeader,
    BarChart,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
    fromDate: { type: [String, Date], default: '' },
    toDate: { type: [String, Date], default: '' },
  },
  data: () => ({
    data: [] as { yearmonth: string; balance: number }[],
    hasData: false,
    periodOptions: ['This Year', 'This Quarter', 'YTD', 'Custom'],
  }),
  computed: {
    chartData() {
      const points = [this.data.map((d) => d.balance)];
      const colors = [
        {
          positive: uicolors.blue[this.darkMode ? '600' : '500'],
          negative: uicolors.pink[this.darkMode ? '600' : '500'],
        },
      ];
      const format = (value: number) => fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      const yMin = getYMin(points);
      return {
        xLabels: this.data.map((d) => d.yearmonth),
        points,
        format,
        colors,
        yMax,
        yMin,
        formatX: formatXLabels,
        gridColor: this.darkMode ? 'rgba(200, 200, 200, 0.2)' : undefined,
        fontColor: this.darkMode ? uicolors.gray['400'] : undefined,
        zeroLineColor: this.darkMode ? uicolors.gray['400'] : undefined,
      };
    },
  },
  watch: {
    fromDate: 'setData',
    toDate: 'setData',
    period: 'setData',
  },
  activated() {
    this.setData();
  },
  methods: {
    formatCustomRange(fromDate: DateTime, toDate: DateTime): string {
      return `${fromDate.toFormat('MMM dd')} - ${toDate.toFormat('MMM dd')}`;
    },
    async setData() {
      const { fromDate, toDate, periodList } = getDashboardDates(
        this.period,
        this.fromDate,
        this.toDate
      );

      const data = await fyo.db.getIncomeAndExpenses(
        fromDate.toISO(),
        toDate.toISO()
      );
      const incomes = getValueMapFromList(data.income, 'yearmonth', 'balance');
      const expenses = getValueMapFromList(
        data.expense,
        'yearmonth',
        'balance'
      );

      this.data = periodList.map((d) => {
        const key = d.toFormat('yyyy-MM');
        const inc = incomes[key] ?? 0;
        const exp = expenses[key] ?? 0;
        return { yearmonth: key, balance: inc - exp };
      });
      if (
        this.period === 'Custom' &&
        toDate.diff(fromDate, 'days').days < 30 &&
        this.data.length === 1
      ) {
        this.data[0].yearmonth = this.formatCustomRange(fromDate, toDate);
      }

      this.hasData = data.income.length > 0 || data.expense.length > 0;
    },
  },
});
</script>
