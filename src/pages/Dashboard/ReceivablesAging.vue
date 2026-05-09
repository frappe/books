<template>
  <div class="flex flex-col w-full p-4">
    <SectionHeader>
      <template #title>{{ t`Receivables Aging` }}</template>
    </SectionHeader>

    <div v-if="hasData" class="mt-4 flex flex-col gap-3 flex-1">
      <!-- Total outstanding line -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ t`Total Outstanding` }}
        </span>
        <span class="text-sm font-semibold dark:text-white">
          {{ fyo.format(totalOutstanding, 'Currency') }}
        </span>
      </div>

      <!-- Segmented stacked bar with hover tooltip -->
      <div class="relative" @mouseleave="hoveredBucket = null">
        <div class="flex h-3 w-full rounded-full overflow-hidden">
          <div
            v-for="bucket in visibleBuckets"
            :key="bucket.label"
            :style="{ width: bucketPct(bucket.amount) + '%' }"
            :class="[
              bucket.barClass,
              'cursor-pointer transition-opacity duration-150',
              hoveredBucket && hoveredBucket.label !== bucket.label
                ? 'opacity-30'
                : 'opacity-100',
            ]"
            @mouseenter="onBarHover(bucket, $event)"
          />
        </div>

        <!-- Hover tooltip -->
        <transition name="ra-fade">
          <div
            v-if="hoveredBucket"
            class="absolute z-50 pointer-events-none"
            :style="tooltipStyle"
          >
            <div
              class="
                bg-white
                dark:bg-gray-900
                border border-gray-200
                dark:border-gray-700
                rounded-lg
                shadow-lg
                px-3
                py-2
                text-xs
                whitespace-nowrap
              "
            >
              <p :class="[hoveredBucket.labelClass, 'font-semibold mb-1']">
                {{ hoveredBucket.label }}
              </p>
              <p class="text-gray-700 dark:text-gray-300 font-medium">
                {{ fyo.format(hoveredBucket.amount, 'Currency') }}
              </p>
              <p class="text-gray-500 dark:text-gray-400 mt-0.5">
                {{ hoveredBucket.count }}
                {{ t`invoices` }} &middot;
                {{ bucketPct(hoveredBucket.amount) }}%
              </p>
            </div>
          </div>
        </transition>
      </div>

      <!-- 2×2 bucket cards grid -->
      <div class="grid grid-cols-2 gap-2 mt-2">
        <div
          v-for="bucket in buckets"
          :key="bucket.label"
          :class="['rounded-lg p-2.5 border', bucket.cardBgClass]"
        >
          <p :class="[bucket.labelClass, 'text-xs font-medium']">
            {{ bucket.label }}
          </p>
          <p class="text-sm font-semibold dark:text-white mt-0.5">
            {{ fyo.format(bucket.amount, 'Currency') }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ bucket.count }} {{ t`invoices` }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center py-10">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ t`No outstanding invoices` }} 🎉
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';
import { safeParseFloat } from 'utils/index';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import SectionHeader from './SectionHeader.vue';

type AgingBucket = {
  label: string;
  minDays: number;
  maxDays: number | null;
  amount: number;
  count: number;
  barClass: string;
  labelClass: string;
  cardBgClass: string;
};

/*
  eslint-disable @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/restrict-plus-operands
*/
export default defineComponent({
  name: 'ReceivablesAging',
  components: { SectionHeader },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      hoveredBucket: null as AgingBucket | null,
      tooltipStyle: {} as Record<string, string>,
      buckets: [
        {
          label: '0–30 days',
          minDays: 0,
          maxDays: 30,
          amount: 0,
          count: 0,
          barClass: 'bg-blue-400 dark:bg-blue-500',
          labelClass: 'text-blue-600 dark:text-blue-400',
          cardBgClass:
            'bg-blue-50 border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/50',
        },
        {
          label: '31–60 days',
          minDays: 31,
          maxDays: 60,
          amount: 0,
          count: 0,
          barClass: 'bg-yellow-400 dark:bg-yellow-500',
          labelClass: 'text-yellow-600 dark:text-yellow-400',
          cardBgClass:
            'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/40 dark:border-yellow-900/50',
        },
        {
          label: '61–90 days',
          minDays: 61,
          maxDays: 90,
          amount: 0,
          count: 0,
          barClass: 'bg-orange-400 dark:bg-orange-500',
          labelClass: 'text-orange-600 dark:text-orange-400',
          cardBgClass:
            'bg-orange-50 border-orange-100 dark:bg-orange-950/40 dark:border-orange-900/50',
        },
        {
          label: '90+ days',
          minDays: 91,
          maxDays: null,
          amount: 0,
          count: 0,
          barClass: 'bg-pink-400 dark:bg-pink-500',
          labelClass: 'text-pink-600 dark:text-pink-400',
          cardBgClass:
            'bg-pink-50 border-pink-100 dark:bg-pink-950/40 dark:border-pink-900/50',
        },
      ] as AgingBucket[],
    };
  },
  computed: {
    totalOutstanding(): number {
      return this.buckets.reduce((sum, b) => sum + b.amount, 0);
    },
    hasData(): boolean {
      return this.totalOutstanding > 0;
    },
    visibleBuckets(): AgingBucket[] {
      return this.buckets.filter((b) => b.amount > 0);
    },
  },
  methods: {
    bucketPct(amount: number): number {
      return Math.round((amount / (this.totalOutstanding || 1)) * 100);
    },
    onBarHover(bucket: AgingBucket, event: MouseEvent) {
      this.hoveredBucket = bucket;
      const bar = (event.currentTarget as HTMLElement).closest<HTMLElement>(
        '.relative'
      );
      if (!bar) return;
      const barRect = bar.getBoundingClientRect();
      const segRect = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      // Center the tooltip over the hovered segment, clamped within the bar
      const segMidX = segRect.left + segRect.width / 2 - barRect.left;
      this.tooltipStyle = {
        bottom: '100%',
        marginBottom: '6px',
        left: `${segMidX}px`,
        transform: 'translateX(-50%)',
      };
    },
    async setData() {
      // Reset all buckets
      for (const bucket of this.buckets) {
        bucket.amount = 0;
        bucket.count = 0;
      }

      const raw = await fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        fields: ['date', 'outstandingAmount'],
        filters: { submitted: true, cancelled: false },
      });

      const now = DateTime.now();

      for (const r of raw) {
        const outstanding = safeParseFloat(r.outstandingAmount);
        if (outstanding <= 0) {
          continue;
        }

        const daysOld = Math.floor(
          now.diff(DateTime.fromISO(r.date as string), 'days').days
        );

        const bucket = this.buckets.find(
          (b) =>
            daysOld >= b.minDays && (b.maxDays === null || daysOld <= b.maxDays)
        );

        if (bucket) {
          bucket.amount += outstanding;
          bucket.count += 1;
        }
      }
    },
  },
});
</script>

<style scoped>
.ra-fade-enter-active,
.ra-fade-leave-active {
  transition: opacity 0.15s ease;
}
.ra-fade-enter-from,
.ra-fade-leave-to {
  opacity: 0;
}
</style>
