<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Profit and Loss` }}</template>
      <template #action>
        <Select
          v-if="projectsEnabled"
          v-model="project"
          class="w-40 mr-2"
          :df="projectSelectDf"
          @change="setData"
        />
        <PeriodSelector
          :value="period"
          :options="periodOptions"
          @change="(value) => (period = value)"
        />
      </template>
    </SectionHeader>
    <BarChart
      v-if="hasData"
      class="mt-4"
      :aspect-ratio="2.05"
      :colors="chartData.colors"
      :grid-color="chartData.gridColor"
      :font-color="chartData.fontColor"
      :points="chartData.points"
      :x-labels="chartData.xLabels"
      :format="chartData.format"
      :format-x="chartData.formatX"
      :y-max="chartData.yMax"
      :y-min="chartData.yMin"
    />
    <div v-else class="flex-1 w-full h-full flex-center my-20">
      <span class="text-base text-gray-600 dark:text-gray-500">
        {{ t`No transactions yet` }}
      </span>
    </div>
  </div>
</template>
<script lang="ts">
import BarChart from 'src/components/Charts/BarChart.vue';
import Select from 'src/components/Controls/Select.vue';
import { fyo } from 'src/initFyo';
import { formatXLabels, getYMax, getYMin } from 'src/utils/chart';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { getValueMapFromList } from 'utils';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';
import { defineComponent } from 'vue';

// Linting broken in this file cause of `extends: ...`
/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return
*/
export default defineComponent({
  name: 'ProfitAndLoss',
  components: {
    PeriodSelector,
    SectionHeader,
    BarChart,
    Select,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data: () => ({
    data: [] as { yearmonth: string; balance: number }[],
    hasData: false,
    periodOptions: ['This Year', 'This Quarter', 'YTD'],
    project: 'all',
    projects: [] as { name: string }[],
  }),
  computed: {
    projectsEnabled() {
      return fyo.singles.AccountingSettings?.enableProjects;
    },
    projectOptions() {
      const options = [{ label: this.t`Show All`, value: 'all' }];
      for (const p of this.projects) {
        options.push({ label: p.name, value: p.name });
      }
      return options;
    },
    projectSelectDf() {
      return {
        fieldname: 'project',
        fieldtype: 'Select',
        label: this.t`Project`,
        options: this.projectOptions,
      };
    },
    chartData() {
      const points = [this.data.map((d) => d.balance)];
      const colors = [
        {
          positive: uicolors.blue[this.darkMode ? '600' : '500'],
          negative: uicolors.pink[this.darkMode ? '600' : '500'],
        },
      ];
      const format = (value: number) => fyo.format(value ?? 0, 'Currency');
      const yMax = getYMax(points);
      const yMin = getYMin(points);
      return {
        xLabels: this.data.map((d) => d.yearmonth),
        points,
        format,
        colors,
        yMax,
        yMin,
        formatX: formatXLabels,
        gridColor: this.darkMode ? 'rgba(200, 200, 200, 0.2)' : undefined,
        fontColor: this.darkMode ? uicolors.gray['400'] : undefined,
        zeroLineColor: this.darkMode ? uicolors.gray['400'] : undefined,
      };
    },
  },
  activated() {
    this.setData();
    this.fetchProjects();
  },
  methods: {
    async fetchProjects() {
      if (this.projectsEnabled) {
        this.projects = await fyo.db.getAll('Project', {
          fields: ['name'],
          filters: { status: 'Active' },
        });
      }
    },
    async setData() {
      const { fromDate, toDate, periodList } = getDatesAndPeriodList(
        this.period
      );

      const project = this.project === 'all' ? undefined : this.project;
      const data = await fyo.db.getIncomeAndExpenses(
        fromDate.toISO(),
        toDate.toISO(),
        project
      );
      const incomes = getValueMapFromList(data.income, 'yearmonth', 'balance');
      const expenses = getValueMapFromList(
        data.expense,
        'yearmonth',
        'balance'
      );

      this.data = periodList.map((d) => {
        const key = d.toFormat('yyyy-MM');
        const inc = incomes[key] ?? 0;
        const exp = expenses[key] ?? 0;
        return { yearmonth: key, balance: inc - exp };
      });
      this.hasData = data.income.length > 0 || data.expense.length > 0;
    },
  },
});
</script>
