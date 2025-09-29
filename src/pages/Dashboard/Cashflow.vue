<template>
  <div>
    <!-- Title and Period Selector -->
    <div class="flex items-center justify-between">
      <div class="font-semibold text-base dark:text-white">
        {{ t`Cashflow` }}
      </div>

      <!-- Chart Legend -->
      <div v-if="hasData" class="flex text-base gap-8">
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-sm inline-block bg-blue-500 dark:bg-blue-600"
          />
          <span class="text-gray-900 dark:text-gray-25">{{ t`Inflow` }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="w-3 h-3 rounded-sm inline-block bg-pink-500 dark:bg-pink-600"
          />
          <span class="text-gray-900 dark:text-gray-25">{{ t`Outflow` }}</span>
        </div>
      </div>
      <div v-else class="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />

      <PeriodSelector
        v-if="hasData"
        :value="period"
        :options="periodOptions"
        @change="(value) => (period = value)"
      />
      <div v-else class="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>

    <!-- Line Chart -->
    <LineChart
      v-if="chartData.points.length"
      class="mt-4"
      :aspect-ratio="4.15"
      :colors="chartData.colors"
      :grid-color="chartData.gridColor"
      :font-color="chartData.fontColor"
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
<script lang="ts">
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { ModelNameEnum } from 'models/types';
import LineChart from 'src/components/Charts/LineChart.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax } from 'src/utils/chart';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import { defineComponent } from 'vue';
import { getMapFromList } from 'utils/index';
import { DateTime } from 'luxon';
// Linting broken in this file cause of `extends: ...`
/* 
  eslint-disable @typescript-eslint/no-unsafe-argument, 
  @typescript-eslint/no-unsafe-return
*/

export default defineComponent({
  name: 'Cashflow',
  components: {
    PeriodSelector,
    LineChart,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
    fromDate: { type: [String, Date], default: '' },
    toDate: { type: [String, Date], default: '' },
    customPeriod: { type: String, default: 'This Year' },
  },
  data: () => ({
    cashflowRecords: [] as {
      inflow: number;
      outflow: number;
      yearmonth: string;
    }[],
    periodList: [],
    periodOptions: ['This Year', 'This Quarter', 'YTD', 'Custom'],
    hasData: false,
  }),
  computed: {
    chartData() {
      let records = this.cashflowRecords;
      let colors = [
        uicolors.blue[this.darkMode ? '600' : '500'],
        uicolors.pink[this.darkMode ? '600' : '500'],
      ];
      if (!this.hasData) {
        records = dummyData;
        colors = [
          this.darkMode ? uicolors.gray['700'] : uicolors.gray['200'],
          this.darkMode ? uicolors.gray['800'] : uicolors.gray['100'],
        ];
      }

      const xLabels = records.map((cf) => cf.yearmonth);
      const points = (['inflow', 'outflow'] as const).map((flowType) =>
        records.map((entry) => entry[flowType])
      );

      const formatCurrency = (value: number) =>
        fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);

      return {
        points,
        xLabels,
        colors,
        format: formatCurrency,
        yMax,
        formatX: formatXLabels,
        gridColor: this.darkMode ? 'rgba(200, 200, 200, 0.2)' : undefined,
        fontColor: this.darkMode ? uicolors.gray['400'] : undefined,
      };
    },
  },
  watch: {
    period: 'setData',
    fromDate: 'setData',
    toDate: 'setData',
  },
  async activated() {
    await this.setData();
    if (!this.hasData) {
      await this.setHasData();
    }
  },
  methods: {
    async setData() {
      let fromDate: DateTime;
      let toDate: DateTime;
      let generatedPeriods: DateTime[] = [];

      if (this.period === 'Custom') {
        const parseDate = (date: string | Date) =>
          DateTime.fromISO(
            typeof date === 'string' ? date : date.toISOString()
          );

        fromDate = parseDate(this.fromDate);
        toDate = parseDate(this.toDate);

        let monthPointer = fromDate.startOf('month');
        const toMonthStart = toDate.startOf('month');

        while (monthPointer <= toMonthStart) {
          generatedPeriods.push(monthPointer);
          monthPointer = monthPointer.plus({ months: 1 });
        }

        generatedPeriods.push(fromDate.startOf('month'));
      } else {
        const dateRange = getDatesAndPeriodList(this.period);
        fromDate = dateRange.fromDate;
        toDate = dateRange.toDate;
        generatedPeriods = dateRange.periodList;
      }

      const cashflowData = await fyo.db.getCashflow(
        fromDate.toISO(),
        toDate.toISO()
      );
      const cashflowMap = getMapFromList(cashflowData, 'yearmonth');

      this.period = this.commonPeriod;
      this.cashflowRecords = generatedPeriods.map((periodDate) => {
        const key = periodDate.toFormat('yyyy-MM');
        const entry = cashflowMap[key];

        return (
          entry ?? {
            inflow: 0,
            outflow: 0,
            yearmonth: key,
          }
        );
      });
    },
    async setHasData() {
      const accounts = await fyo.db.getAllRaw('Account', {
        filters: {
          accountType: ['in', [AccountTypeEnum.Cash, AccountTypeEnum.Bank]],
        },
      });
      const accountNames = accounts.map((account) => account.name as string);
      const ledgerEntryCount = await fyo.db.count(
        ModelNameEnum.AccountingLedgerEntry,
        {
          filters: { account: ['in', accountNames] },
        }
      );
      this.hasData = ledgerEntryCount > 0;
    },
  },
});

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
