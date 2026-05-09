<template>
  <div class="flex flex-col w-full p-4">
    <SectionHeader>
      <template #title>{{ t`Upcoming Bills` }}</template>
      <template #action>
        <button
          v-if="billList.length"
          class="
            text-xs text-blue-500
            dark:text-blue-400
            hover:underline
            font-medium
          "
          @click="openBillList"
        >
          {{ t`View All` }}
        </button>
      </template>
    </SectionHeader>

    <div class="mt-3 flex flex-col divide-y dark:divide-gray-800">
      <div
        v-for="bill in billList"
        :key="bill.name"
        class="
          flex
          items-center
          justify-between
          py-2
          cursor-pointer
          hover:bg-gray-50
          dark:hover:bg-gray-800
          rounded
          px-1
          -mx-1
        "
        @click="openBill(bill.name)"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium dark:text-white truncate">
            {{ bill.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ bill.party }}
          </p>
        </div>
        <div class="text-right shrink-0 ms-3">
          <p class="text-sm font-semibold text-orange-500 dark:text-orange-400">
            {{ fyo.format(bill.outstandingAmount, 'Currency') }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ bill.daysAgo }}&nbsp;{{ t`days ago` }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="!billList.length"
      class="flex-1 flex items-center justify-center py-10"
    >
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ t`No upcoming bills` }}
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
import { routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import SectionHeader from './SectionHeader.vue';

/* eslint-disable @typescript-eslint/no-unsafe-argument */
export default defineComponent({
  name: 'UpcomingBills',
  components: { SectionHeader },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      billList: [] as {
        name: string;
        party: string;
        date: string;
        outstandingAmount: number;
        daysAgo: number;
      }[],
    };
  },
  methods: {
    async setData() {
      const now = DateTime.utc();
      const fromDate = now.minus({ days: 30 });
      const raw = await fyo.db.getAllRaw(ModelNameEnum.PurchaseInvoice, {
        fields: ['name', 'party', 'date', 'outstandingAmount'],
        filters: {
          submitted: true,
          cancelled: false,
          date: ['>=', fromDate.toISO(), '<=', now.toISO()],
        },
        orderBy: 'date',
        order: 'asc',
        limit: 5,
      });

      this.billList = raw
        .map((r) => ({
          name: r.name as string,
          party: r.party as string,
          date: r.date as string,
          outstandingAmount: safeParseFloat(r.outstandingAmount),
          daysAgo: Math.max(
            0,
            Math.floor(
              now.diff(DateTime.fromISO(r.date as string), 'days').days
            )
          ),
        }))
        .filter((r) => r.outstandingAmount > 0);
    },
    async openBill(name: string) {
      await routeTo(`/edit/${ModelNameEnum.PurchaseInvoice}/${name}`);
    },
    async openBillList() {
      const filters = JSON.stringify({
        submitted: 1,
        cancelled: 0,
        outstandingAmount: ['>', 0],
      });
      await routeTo({
        path: `/list/${ModelNameEnum.PurchaseInvoice}/Upcoming Bills`,
        query: { filters },
      });
    },
  },
});
</script>
