<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Gross Margin` }}</template>
      <template #action>
        <PeriodSelector
          :value="period"
          :options="periodOptions"
          @change="(v) => (period = v)"
        />
      </template>
    </SectionHeader>

    <div v-if="income > 0 || cogs > 0" class="mt-4 flex flex-col gap-4">
      <!-- Big % number -->
      <div class="flex flex-col items-center py-3">
        <p
          class="text-5xl font-bold tabular-nums"
          :class="
            marginPct >= 50
              ? 'text-green-500 dark:text-green-400'
              : marginPct >= 20
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-pink-500 dark:text-pink-400'
          "
        >
          {{ marginPct }}<span class="text-2xl">%</span>
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t`Gross Margin` }}
        </p>
      </div>

      <!-- Revenue / COGS row -->
      <div
        class="flex justify-between border-t dark:border-gray-800 pt-3 text-sm"
      >
        <div>
          <p class="text-gray-500 dark:text-gray-400">{{ t`Revenue` }}</p>
          <p class="font-semibold dark:text-white mt-0.5">
            {{ fyo.format(income, 'Currency') }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-gray-500 dark:text-gray-400">
            {{ t`Cost of Goods Sold` }}
          </p>
          <p class="font-semibold dark:text-white mt-0.5">
            {{ fyo.format(cogs, 'Currency') }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center py-10">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ t`No transactions yet` }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { fyo } from 'src/initFyo';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

/* eslint-disable @typescript-eslint/no-unsafe-argument */
export default defineComponent({
  name: 'GrossMargin',
  components: { SectionHeader, PeriodSelector },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      income: 0 as number,
      cogs: 0 as number,
      periodOptions: ['This Year', 'This Quarter', 'This Month', 'YTD'],
    };
  },
  computed: {
    marginPct(): number {
      if (this.income <= 0) return 0;
      return Math.round(((this.income - this.cogs) / this.income) * 100);
    },
  },
  methods: {
    async setData() {
      const { fromDate, toDate } = getDatesAndPeriodList(this.period);
      const result = await fyo.db.getGrossMargin(
        fromDate.toISO(),
        toDate.toISO()
      );
      this.income = result?.income ?? 0;
      this.cogs = result?.cogs ?? 0;
    },
  },
});
</script>
