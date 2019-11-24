<template>
  <div class="mt-6">
    <div class="flex items-center justify-between">
      <div class="font-medium">{{ _('Cash Flow') }}</div>
      <div class="flex text-base">
        <div class="flex items-center">
          <span class="w-3 h-3 rounded inline-block bg-blue-500"></span>
          <span class="ml-2">{{ _('Inflow') }}</span>
        </div>
        <div class="flex items-center ml-6">
          <span class="w-3 h-3 rounded inline-block bg-gray-500"></span>
          <span class="ml-2">{{ _('Outflow') }}</span>
        </div>
      </div>
      <PeriodSelector :value="period" @change="value => (period = value)" />
    </div>
    <div class="chart-wrapper" ref="cashflow"></div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import { Chart } from 'frappe-charts';
import PeriodSelector from './PeriodSelector';
import Cashflow from '../../../reports/Cashflow/Cashflow';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';

export default {
  name: 'Cashflow',
  components: {
    PeriodSelector
  },
  data: () => ({ period: 'This Year' }),
  watch: {
    period: 'render'
  },
  mounted() {
    this.render();
  },
  methods: {
    async render() {
      let { fromDate, toDate, periodicity } = await getDatesAndPeriodicity(
        this.period
      );

      let { data, periodList } = await new Cashflow().run({
        fromDate,
        toDate,
        periodicity
      });

      const chart = new Chart(this.$refs['cashflow'], {
        title: '',
        type: 'line',
        animate: false,
        colors: ['#2490EF', '#B7BFC6'],
        axisOptions: {
          xAxisMode: 'tick',
          shortenYAxisNumbers: true
        },
        lineOptions: {
          regionFill: 1,
          hideDots: 1,
          heatLine: 1
        },
        tooltipOptions: {
          formatTooltipY: value => frappe.format(value, 'Currency')
        },
        data: {
          labels: periodList,
          datasets: [
            {
              name: 'Inflow',
              chartType: 'line',
              values: data.map(period => period.inflow)
            },
            {
              name: 'Outflow',
              chartType: 'line',
              values: data.map(period => period.outflow)
            }
          ]
        }
      });
    }
  }
};
</script>
