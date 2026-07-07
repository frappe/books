<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Best Sellers` }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(value) => (period = value)" />
      </template>
    </SectionHeader>

    <div v-show="hasData" class="flex relative">
      <!-- Chart Legend -->
      <div class="w-1/2 flex flex-col gap-4 justify-center dark:text-gray-25">
        <!-- Legend Item -->
        <div
          v-for="(d, i) in sellers"
          :key="d.item"
          class="flex items-center text-sm"
          @mouseover="active = i"
          @mouseleave="active = null"
        >
          <div class="w-3 h-3 rounded-sm flex-shrink-0" :class="d.class" />
          <p class="ms-2 overflow-x-auto whitespace-nowrap no-scrollbar w-28">
            {{ d.item || 'Unknown' }}
          </p>
          <p class="whitespace-nowrap flex-shrink-0 ms-auto">
            {{ fyo.format(d?.total ?? 0, 'Currency') }}
          </p>
        </div>
      </div>
      <DonutChart
        class="w-1/2 my-auto"
        :active="active"
        :sectors="sectors"
        :offset-x="3"
        :thickness="10"
        :text-offset-x="6.5"
        :value-formatter="(value: number) => fyo.format(value, 'Currency')"
        :total-label="t`Total Sales`"
        :dark-mode="darkMode"
        @change="(value: number) => (active = value)"
      />
    </div>

    <!-- Empty Message -->
    <div
      v-if="sellers.length === 0"
      class="flex-1 w-full h-full flex-center my-20"
    >
      <span class="text-base text-gray-600 dark:text-gray-500">
        {{ t`No sales in this period` }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { truncate } from 'lodash';
import { fyo } from 'src/initFyo';
import { uicolors } from 'src/utils/colors';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { defineComponent } from 'vue';
import DonutChart from '../../components/Charts/DonutChart.vue';
import DashboardChartBase from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

// Linting broken in this file cause of `extends: ...`
/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/restrict-plus-operands
*/
export default defineComponent({
  name: 'BestSellers',
  components: {
    DonutChart,
    PeriodSelector,
    SectionHeader,
  },
  extends: DashboardChartBase,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data: () => ({
    active: null as null | number,
    sellers: [] as {
      item: string;
      total: number;
      color: { color: string; darkColor: string };
      class: { class: string; darkClass: string };
    }[],
  }),
  computed: {
    totalSales(): number {
      return this.sellers.reduce((sum, seller) => sum + seller.total, 0);
    },
    hasData(): boolean {
      return this.sellers.length > 0;
    },
    sectors(): {
      color: { color: string; darkColor: string };
      label: string;
      value: number;
    }[] {
      return this.sellers.map(({ item, color, total }) => ({
        color,
        label: truncate(item || 'Unknown Item', { length: 21 }),
        value: total,
      }));
    },
  },
  activated() {
    this.setData();
  },
  methods: {
    async setData() {
      const { fromDate, toDate } = getDatesAndPeriodList(this.period);
         let bestSellers: { item: string; total: number }[] = [];
         try {
             bestSellers = (await fyo.db.getBestSellers(
                 fromDate.toISO(),
                 toDate.toISO()
               )) || [];
           } catch (e) {
                 console.error(e);
            }
      const shades = [
        { class: 'bg-teal-500', hex: uicolors.teal['500'] },
        { class: 'bg-teal-400', hex: uicolors.teal['400'] },
        { class: 'bg-teal-300', hex: uicolors.teal['300'] },
        { class: 'bg-teal-200', hex: uicolors.teal['200'] },
        { class: 'bg-teal-100', hex: uicolors.teal['100'] },
      ];

      const darkshades = [
        { class: 'bg-teal-600', hex: uicolors.teal['600'] },
        { class: 'bg-teal-500', hex: uicolors.teal['500'] },
        { class: 'bg-teal-400', hex: uicolors.teal['400'] },
        { class: 'bg-teal-300', hex: uicolors.teal['300'] },
        {
          class: 'bg-teal-200 dark:bg-opacity-80',
          hex: uicolors.teal['200'] + 'CC',
        },
      ];

      this.sellers = bestSellers
        .filter((e) => e.total > 0)
        .map((d, i) => {
          return {
            item: d.item,
            total: d.total,
            color: { color: shades[i].hex, darkColor: darkshades[i].hex },
            class: { class: shades[i].class, darkClass: darkshades[i].class },
          };
        });
    },
  },
});
</script>
