<template>
  <div class="col-6">
    <div class="border-bottom my-3">
      <div :ref="chartData.title"></div>
    </div>
  </div>
</template>

<script>
import { Chart } from 'frappe-charts';

export default {
  name: 'DashboardCard',
  props: ['chartData'],
  mounted() {
    const chart = new Chart(this.$refs[this.chartData.title], {
      title: this.chartData.title,
      data: this.chartData.data,
      type: this.chartData.type, // or 'bar', 'line', 'scatter', 'pie', 'percentage'
      height: 250,
      colors: [this.chartData.color]
    });
  }
};
</script>
