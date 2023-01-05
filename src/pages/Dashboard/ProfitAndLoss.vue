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
      class="mt-4"
      v-if="hasData"
      :aspect-ratio="2.05"
      :colors="chartData.colors"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :y-min="chartData.yMin"
    />
    <div class="flex-1 w-full h-full flex-center my-20" v-else>
      <span class="text-base text-gray-600">
        {{ t`No transactions yet` }}
      </span>
    </div>
  </div>
</template>
<script>
import BarChart from 'src/components/Charts/BarChart.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax, getYMin } from 'src/utils/chart';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { getValueMapFromList } from 'utils';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';

export default {
  name: 'ProfitAndLoss',
  extends: DashboardChartBase,
  components: {
    PeriodSelector,
    SectionHeader,
    BarChart,
  },
  data: () => ({
    data: [],
    hasData: false,
    periodOptions: ['This Year', 'This Quarter'],
  }),
  activated() {
    this.setData();
  },
  computed: {
    chartData() {
      const points = [this.data.map((d) => d.balance)];
      const colors = [
        { positive: uicolors.blue['500'], negative: uicolors.pink['500'] },
      ];
      const format = (value) => fyo.format(value ?? 0, 'Currency');
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
      };
    },
  },
  methods: {
    async setData() {
      const { fromDate, toDate, periodList } = await getDatesAndPeriodList(
        this.period
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
      this.hasData = data.income.length > 0 || data.expense.length > 0;
    },
  },
};
</script>
