<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template slot="title">{{ t('Profit and Loss') }}</template>
      <PeriodSelector
        slot="action"
        :value="period"
        :options="['This Year', 'This Quarter']"
        @change="(value) => (period = value)"
      />
    </SectionHeader>
    <BarChart
      v-if="hasData"
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
        {{ t('No transactions yet') }}
      </span>
    </div>
  </div>
</template>
<script>
import frappe from 'frappe';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import ProfitAndLoss from '../../../reports/ProfitAndLoss/ProfitAndLoss';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';
import BarChart from '@/components/Charts/BarChart.vue';
import { getYMax, getYMin } from '@/components/Charts/chartUtils';
import { formatXLabels } from '@/utils';

export default {
  name: 'ProfitAndLoss',
  components: {
    PeriodSelector,
    SectionHeader,
    BarChart,
  },
  data: () => ({
    period: 'This Year',
    data: [],
    periodList: [],
  }),
  activated() {
    this.setData();
  },
  watch: {
    period: 'setData',
  },
  computed: {
    chartData() {
      const points = [this.periodList.map((p) => this.data[p])];
      const colors = [{ positive: '#2490EF', negative: '#B7BFC6' }];
      const format = (value) => frappe.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      const yMin = getYMin(points);
      return {
        xLabels: this.periodList,
        points,
        format,
        colors,
        yMax,
        yMin,
        formatX: formatXLabels,
      };
    },
    hasData() {
      return this.periodList.some((key) => this.data[key] !== 0);
    },
  },
  methods: {
    async setData() {
      let { fromDate, toDate, periodicity } = await getDatesAndPeriodicity(
        this.period
      );

      let pl = new ProfitAndLoss();
      let res = await pl.run({
        fromDate,
        toDate,
        periodicity,
      });

      this.data = res.rows.at(-1);
      this.periodList = res.columns;
    },
  },
};
</script>
