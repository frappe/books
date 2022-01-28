<template>
  <div class="mx-4">
    <template v-if="hasData">
      <div class="flex items-center justify-between">
        <div class="font-medium">{{ t('Cashflow') }}</div>
        <div class="flex text-base">
          <div class="flex items-center">
            <span class="w-3 h-3 rounded-sm inline-block bg-blue-500"></span>
            <span class="ml-2 text-gray-900">{{ t('Inflow') }}</span>
          </div>
          <div class="flex items-center ml-6">
            <span class="w-3 h-3 rounded-sm inline-block bg-gray-500"></span>
            <span class="ml-2 text-gray-900">{{ t('Outflow') }}</span>
          </div>
        </div>
        <PeriodSelector
          :value="period"
          @change="(value) => (period = value)"
          :options="['This Year', 'This Quarter']"
        />
      </div>
      <LineChart
        v-if="hasData"
        :colors="chartData.colors"
        :points="chartData.points"
        :x-labels="chartData.xLabels"
        :format="chartData.format"
        :format-x="chartData.formatX"
        :y-max="chartData.yMax"
      />
    </template>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 889 280"
      class="my-4"
    >
      <defs>
        <linearGradient x1="50%" y1="100%" x2="50%" y2=".889%" id="a">
          <stop stop-color="#FFF" stop-opacity="0" offset="0%" />
          <stop stop-color="#F4F4F6" offset="100%" />
        </linearGradient>
      </defs>
      <g fill="none" fill-rule="evenodd">
        <text fill="#112B42" class="font-medium">
          <tspan y="16">{{ t('Cashflow') }}</tspan>
        </text>
        <g fill="#E9E9ED">
          <path d="M371 2h12v12h-12zM391 2h53v12h-53z" />
          <g>
            <path d="M453 2h12v12h-12zM473 2h53v12h-53z" />
          </g>
        </g>
        <path
          fill="#E9E9ED"
          d="M0 41h19v12H0zM4 121h15v12H4zM2 81h17v12H2zM4 201h15v12H4zM3 161h16v12H3z"
        />
        <path
          d="M37.25 211.25h849.5v1H37.25zM37.25 167.25h849.5v1H37.25zM37.25 127.25h849.5v1H37.25zM37.25 87.25h849.5v1H37.25zM37.25 47.25h849.5v1H37.25z"
          stroke="#F6F7F9"
          stroke-width=".5"
        />
        <g fill="#E9E9ED">
          <path
            d="M49 228h31v12H49zM122 228h31v12h-31zM195 228h31v12h-31zM268 228h31v12h-31zM341 228h31v12h-31zM414 228h31v12h-31zM487 228h31v12h-31zM560 228h31v12h-31zM633 228h31v12h-31zM706 228h31v12h-31zM779 228h31v12h-31zM852 228h31v12h-31z"
          />
        </g>
        <g fill-rule="nonzero">
          <path
            fill="url(#a)"
            opacity=".5"
            d="M12 34l78 73 73 12 74-37 73 36.167L383 126l73-55.5L529.223 98 602 0l73 75 73 2 73 34 29 41v25H0V25z"
            transform="translate(37 35)"
          />
          <path
            stroke="#E9E9ED"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M37 60l12 9 78 73 73 12 74-37 73 36.167L420 161l73-55.5 73.223 27.5L639 35l73 75 73 2 73 34 29 42"
          />
          <g>
            <path
              fill="url(#a)"
              opacity=".5"
              d="M12 44.599l78 31.345 73 5.152 74-26.192L310 .738l73 21.578 73 37.955 73.223 11.808L602 30l73 32.203 73 .86 73 14.598L850 58v48H0V40.734z"
              transform="translate(37 106)"
            />
            <path
              stroke="#E9E9ED"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M37 146.734l12 3.865 78 31.345 73 5.152 74-26.192 73-54.166 73 21.578 73 37.955 73.223 11.808L639 136l73 32.203 73 .86 73 14.598L887 164"
            />
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>
<script>
import frappe from 'frappe';
import PeriodSelector from './PeriodSelector';
import Cashflow from '../../../reports/Cashflow/Cashflow';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';
import LineChart from '@/components/Charts/LineChart.vue';
import { getYMax } from '@/components/Charts/chartUtils';
import { formatXLabels } from '@/utils';

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
  }),
  watch: {
    period: 'setData',
  },
  async activated() {
    await this.setData();
  },
  computed: {
    hasData() {
      let totalInflow = this.data.reduce((sum, d) => d.inflow + sum, 0);
      let totalOutflow = this.data.reduce((sum, d) => d.outflow + sum, 0);
      return !(totalInflow === 0 && totalOutflow === 0);
    },
    chartData() {
      const xLabels = this.periodList;
      const points = ['inflow', 'outflow'].map((k) =>
        this.data.map((d) => d[k])
      );
      const colors = ['#2490EF', '#B7BFC6'];
      const format = (value) => frappe.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      return { points, xLabels, colors, format, yMax, formatX: formatXLabels };
    },
  },
  methods: {
    async setData() {
      let { fromDate, toDate, periodicity } = await getDatesAndPeriodicity(
        this.period
      );

      const { data, periodList } = await new Cashflow().run({
        fromDate,
        toDate,
        periodicity,
      });

      this.data = data;
      this.periodList = periodList;
    },
  },
};
</script>
