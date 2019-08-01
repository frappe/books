<template>
  <div class="col-6">
    <div class="card mx-2 my-2">
      <div class="card-body">
        <div :ref="chartData.title"></div>
      </div>
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
