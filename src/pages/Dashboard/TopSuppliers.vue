<template>
  <div class="flex flex-col w-full p-4">
    <SectionHeader>
      <template #title>{{ t`Top Suppliers` }}</template>
      <template #action>
        <PeriodSelector :value="period" @change="(v) => (period = v)" />
      </template>
    </SectionHeader>

    <div v-if="suppliers.length" class="mt-3 flex flex-col gap-3">
      <div
        v-for="(s, i) in suppliers"
        :key="s.party"
        class="flex items-center gap-3"
      >
        <!-- rank -->
        <span
          class="
            text-xs
            font-bold
            text-gray-400
            dark:text-gray-500
            w-4
            shrink-0
          "
        >
          {{ i + 1 }}
        </span>
        <!-- name + bar -->
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-baseline mb-0.5">
            <span class="text-sm font-medium dark:text-white truncate">{{
              s.party
            }}</span>
            <span
              class="text-xs text-gray-500 dark:text-gray-400 shrink-0 ms-2"
            >
              {{ fyo.format(s.total, 'Currency') }}
            </span>
          </div>
          <div
            class="
              w-full
              h-1.5
              bg-gray-100
              dark:bg-gray-800
              rounded-full
              overflow-hidden
            "
          >
            <div
              class="
                h-full
                rounded-full
                bg-orange-500
                dark:bg-orange-600
                transition-all
              "
              :style="{ width: barWidth(s.total) + '%' }"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center py-10">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ t`No purchases in this period` }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { fyo } from 'src/initFyo';
import { getDatesAndPeriodList } from 'src/utils/misc';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import PeriodSelector from './PeriodSelector.vue';
import SectionHeader from './SectionHeader.vue';

/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return
*/
export default defineComponent({
  name: 'TopSuppliers',
  components: { SectionHeader, PeriodSelector },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      suppliers: [] as { party: string; total: number }[],
    };
  },
  computed: {
    maxTotal(): number {
      return this.suppliers[0]?.total ?? 1;
    },
  },
  methods: {
    async setData() {
      const { fromDate, toDate } = getDatesAndPeriodList(this.period);
      this.suppliers = await fyo.db.getTopSuppliers(
        fromDate.toISO(),
        toDate.toISO()
      );
    },
    barWidth(total: number): number {
      return Math.round((total / (this.maxTotal || 1)) * 100);
    },
  },
});
</script>
