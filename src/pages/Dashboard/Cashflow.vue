<template>
  <div>
    <!-- Title and Period Selector -->
    <div class="flex items-center justify-between">
      <div class="font-semibold text-base">{{ t`Cashflow` }}</div>

      <!-- Chart Legend -->
      <div class="flex text-base gap-8" v-if="hasData">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm inline-block bg-blue-500" />
          <span class="text-gray-900">{{ t`Inflow` }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm inline-block bg-pink-500" />
          <span class="text-gray-900">{{ t`Outflow` }}</span>
        </div>
      </div>
      <div v-else class="w-16 h-5 bg-gray-200 rounded" />

      <PeriodSelector
        :value="period"
        @change="(value) => (period = value)"
        :options="periodOptions"
        v-if="hasData"
      />
      <div v-else class="w-20 h-5 bg-gray-200 rounded" />
    </div>

    <!-- Line Chart -->
    <LineChart
      class="mt-4"
      v-if="chartData.points.length"
      :aspect-ratio="4.15"
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
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { getMapFromList } from 'utils/';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';

export default {
  name: 'Cashflow',
  extends: DashboardChartBase,
  components: {
    PeriodSelector,
    LineChart,
  },
  data: () => ({
    data: [],
    periodList: [],
    periodOptions: ['This Year', 'This Quarter'],
    hasData: false,
  }),
  async activated() {
    await this.setData();
    if (!this.hasData) {
      await this.setHasData();
    }
  },
  computed: {
    chartData() {
      let data = this.data;
      let colors = [uicolors.blue['500'], uicolors.pink['500']];
      if (!this.hasData) {
        data = dummyData;
        colors = [uicolors.gray['200'], uicolors.gray['100']];
      }

      const xLabels = data.map((cf) => cf['yearmonth']);
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

      const data = await fyo.db.getCashflow(fromDate.toISO(), toDate.toISO());
      const dataMap = getMapFromList(data, 'yearmonth');
      this.data = periodList.map((p) => {
        const key = p.toFormat('yyyy-MM');
        const item = dataMap[key];
        if (item) {
          return item;
        }

        return {
          inflow: 0,
          outflow: 0,
          yearmonth: key,
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
    yearmonth: '2021-05',
  },
  {
    inflow: 350,
    outflow: 100,
    yearmonth: '2021-06',
  },
  {
    inflow: 50,
    outflow: 300,
    yearmonth: '2021-07',
  },
  {
    inflow: 320,
    outflow: 100,
    yearmonth: '2021-08',
  },
];
</script>
