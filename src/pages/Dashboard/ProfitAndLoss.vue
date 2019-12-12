<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template slot="title">{{ _('Profit and Loss') }}</template>
      <PeriodSelector
        v-if="hasData"
        slot="action"
        :value="period"
        @change="value => (period = value)"
      />
    </SectionHeader>
    <div v-if="hasData" class="chart-wrapper" ref="profit-and-loss"></div>
    <div class="flex-1 w-full h-full flex-center" v-else>
      <span class="text-base text-gray-600">
        {{ _('No transactions yet') }}
      </span>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import { Chart } from 'frappe-charts';
import PeriodSelector from './PeriodSelector';
import SectionHeader from './SectionHeader';
import ProfitAndLoss from '../../../reports/ProfitAndLoss/ProfitAndLoss';
import { getDatesAndPeriodicity } from './getDatesAndPeriodicity';

export default {
  name: 'ProfitAndLoss',
  components: {
    PeriodSelector,
    SectionHeader
  },
  data: () => ({ period: 'This Year', hasData: false }),
  activated() {
    this.render();
  },
  watch: {
    period: 'render'
  },
  methods: {
    async render() {
      let { fromDate, toDate, periodicity } = await getDatesAndPeriodicity(
        this.period
      );

      let pl = new ProfitAndLoss();
      let res = await pl.run({
        fromDate,
        toDate,
        periodicity
      });

      let totalRow = res.rows[res.rows.length - 1];
      this.hasData = res.columns.some(key => totalRow[key] !== 0);
      if (!this.hasData) return;
      this.$nextTick(() => this.renderChart(res));
    },

    renderChart(res) {
      let totalRow = res.rows[res.rows.length - 1];
      const chart = new Chart(this.$refs['profit-and-loss'], {
        title: '',
        animate: false,
        type: 'bar',
        colors: ['#2490EF', '#B7BFC6'],
        axisOptions: {
          xAxisMode: 'tick',
          shortenYAxisNumbers: true,
          xIsSeries: true
        },
        tooltipOptions: {
          formatTooltipY: value => frappe.format(value, 'Currency')
        },
        data: {
          labels: res.columns,
          datasets: [
            {
              name: 'Income',
              chartType: 'bar',
              values: res.columns.map(key => totalRow[key])
            }
          ]
        }
      });
    }
  }
};
</script>
