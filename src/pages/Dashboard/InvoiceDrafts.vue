<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Draft Invoices` }}</template>
      <template #action>
        <button
          v-if="count > 0"
          class="
            text-xs text-blue-500
            dark:text-blue-400
            hover:underline
            font-medium
          "
          @click="openDraftList"
        >
          {{ t`View All` }}
        </button>
      </template>
    </SectionHeader>

    <div
      v-if="count > 0"
      class="mt-4 flex flex-1 items-center justify-center gap-0"
    >
      <!-- Count stat -->
      <div class="flex flex-col items-center flex-1 py-3">
        <p
          class="text-4xl font-bold tabular-nums text-gray-900 dark:text-white"
        >
          {{ count }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t`Unsent Invoices` }}
        </p>
      </div>

      <!-- Vertical divider -->
      <div class="w-px self-stretch bg-gray-200 dark:bg-gray-700 my-3" />

      <!-- Total value stat -->
      <div class="flex flex-col items-center flex-1 py-3">
        <p
          class="text-4xl font-bold tabular-nums text-gray-900 dark:text-white"
        >
          {{ fyo.format(totalValue, 'Currency') }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t`Total Value` }}
        </p>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center py-10">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ t`No draft invoices` }} ✓
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import { safeParseFloat } from 'utils/index';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import SectionHeader from './SectionHeader.vue';

/* eslint-disable @typescript-eslint/no-unsafe-argument */
export default defineComponent({
  name: 'InvoiceDrafts',
  components: { SectionHeader },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      count: 0 as number,
      totalValue: 0 as number,
    };
  },
  methods: {
    async setData() {
      const raw = await fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        fields: ['name', 'baseGrandTotal'],
        filters: { submitted: false, cancelled: false },
      });

      this.count = raw.length;
      this.totalValue = raw.reduce(
        (sum, r) => sum + safeParseFloat(r.baseGrandTotal),
        0
      );
    },
    async openDraftList() {
      await routeTo({
        path: `/list/${ModelNameEnum.SalesInvoice}/Draft Invoices`,
        query: {
          filters: JSON.stringify({ submitted: false, cancelled: false }),
        },
      });
    },
  },
});
</script>
