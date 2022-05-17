<template>
  <div>
    <!-- Title and Period Selector -->
    <div class="flex items-center justify-between">
      <div class="font-medium">{{ t`Cashflow` }}</div>

      <!-- Chart Legend -->
      <div class="flex text-base" v-if="hasData">
        <div class="flex items-center">
          <span class="w-3 h-3 rounded-sm inline-block bg-blue-500"></span>
          <span class="ml-2 text-gray-900">{{ t`Inflow` }}</span>
        </div>
        <div class="flex items-center ml-6">
          <span class="w-3 h-3 rounded-sm inline-block bg-gray-500"></span>
          <span class="ml-2 text-gray-900">{{ t`Outflow` }}</span>
        </div>
      </div>
      <div v-else class="w-16 h-5 bg-gray-200 rounded" />

      <PeriodSelector
        :value="period"
        @change="(value) => (period = value)"
        :options="['This Year', 'This Quarter']"
        v-if="hasData"
      />
      <div v-else class="w-20 h-5 bg-gray-200 rounded" />
    </div>

    <!-- Line Chart -->
    <LineChart
      v-if="chartData.points.length"
      :colors="chartData.colors"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :draw-labels="hasData"
      :show-tooltip="hasData"
    />
  </div>
</template>
<script>
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { ModelNameEnum } from 'models/types';
import LineChart from 'src/components/Charts/LineChart.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax } from 'src/utils/chart';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { getMapFromList } from 'utils/';
import PeriodSelector from './PeriodSelector';

export default {
  name: 'Cashflow',
  components: {
    PeriodSelector,
    LineChart,
  },
  data: () => ({
    period: 'This Year',
    data: [],
    periodList: [],
    hasData: false,
  }),
  watch: {
    period: 'setData',
  },
  async activated() {
    await this.setData();
    if (!this.hasData) {
      await this.setHasData();
    }
  },
  computed: {
    chartData() {
      let data = this.data;
      let colors = ['#2490EF', '#B7BFC6'];
      if (!this.hasData) {
        data = dummyData;
        colors = ['#E9EBED', '#B7BFC6'];
      }

      const xLabels = data.map((cf) => cf['month-year']);
      const points = ['inflow', 'outflow'].map((k) => data.map((d) => d[k]));

      const format = (value) => fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      return { points, xLabels, colors, format, yMax, formatX: formatXLabels };
    },
  },
  methods: {
    async setData() {
      const { periodList, fromDate, toDate } = await getDatesAndPeriodList(
        this.period
      );

      const data = await fyo.db.getCashflow(fromDate, toDate);
      const dataMap = getMapFromList(data, 'month-year');
      this.data = periodList.map((p) => {
        const key = p.toFormat('yyyy-MM');
        const item = dataMap[key];
        if (item) {
          return item;
        }

        return {
          inflow: 0,
          outflow: 0,
          'month-year': key,
        };
      });
    },
    async setHasData() {
      const accounts = await fyo.db.getAllRaw('Account', {
        filters: {
          accountType: ['in', [AccountTypeEnum.Cash, AccountTypeEnum.Bank]],
        },
      });
      const accountNames = accounts.map((a) => a.name);
      const count = await fyo.db.count(ModelNameEnum.AccountingLedgerEntry, {
        filters: { account: ['in', accountNames] },
      });
      this.hasData = count > 0;
    },
  },
};

const dummyData = [
  {
    inflow: 100,
    outflow: 250,
    'month-year': '2021-05',
  },
  {
    inflow: 350,
    outflow: 100,
    'month-year': '2021-06',
  },
  {
    inflow: 50,
    outflow: 300,
    'month-year': '2021-07',
  },
  {
    inflow: 320,
    outflow: 100,
    'month-year': '2021-08',
  },
];
</script>
