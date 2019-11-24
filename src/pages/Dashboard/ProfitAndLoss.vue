<template>
  <div>
    <SectionHeader>
      <template slot="title">{{ _('Profit and Loss') }}</template>
      <PeriodSelector
        slot="action"
        :value="period"
        @change="value => (period = value)"
      />
    </SectionHeader>
    <div class="chart-wrapper" ref="profit-and-loss"></div>
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
  data: () => ({ period: 'This Year' }),
  mounted() {
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
