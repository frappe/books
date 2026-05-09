<template>
  <div class="flex flex-col w-full p-4">
    <SectionHeader>
      <template #title>{{ t`Overdue Invoices` }}</template>
      <template #action>
        <button
          v-if="overdueList.length"
          class="
            text-xs text-blue-500
            dark:text-blue-400
            hover:underline
            font-medium
          "
          @click="openInvoiceList"
        >
          {{ t`View All` }}
        </button>
      </template>
    </SectionHeader>

    <div class="mt-3 flex flex-col divide-y dark:divide-gray-800">
      <div
        v-for="inv in overdueList"
        :key="inv.name"
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
        @click="openInvoice(inv.name)"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium dark:text-white truncate">
            {{ inv.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ inv.party }}
          </p>
        </div>
        <div class="text-right shrink-0 ms-3">
          <p class="text-sm font-semibold text-pink-500 dark:text-pink-400">
            {{ fyo.format(inv.outstandingAmount, 'Currency') }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ inv.daysOverdue }}&nbsp;{{ t`days overdue` }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="!overdueList.length"
      class="flex-1 flex items-center justify-center py-10"
    >
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ t`No overdue invoices` }} 🎉
      </span>
    </div>
  </div>
</template>

<script lang="ts">
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
  name: 'OverdueInvoices',
  components: { SectionHeader },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      overdueList: [] as {
        name: string;
        party: string;
        date: string;
        outstandingAmount: number;
        daysOverdue: number;
      }[],
    };
  },
  methods: {
    async setData() {
      const cutoff = DateTime.utc().minus({ days: 30 });
      const raw = await fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        fields: ['name', 'party', 'date', 'outstandingAmount'],
        filters: {
          submitted: true,
          cancelled: false,
          date: ['<', cutoff.toISO()],
        },
        orderBy: 'date',
        order: 'desc',
        limit: 5,
      });

      const now = DateTime.utc();
      this.overdueList = raw
        .map((r) => ({
          name: r.name as string,
          party: r.party as string,
          date: r.date as string,
          outstandingAmount: safeParseFloat(r.outstandingAmount),
          daysOverdue: Math.max(
            0,
            Math.floor(
              now.diff(DateTime.fromISO(r.date as string), 'days').days
            )
          ),
        }))
        .filter((r) => r.outstandingAmount > 0);
    },
    async openInvoice(name: string) {
      await routeTo(`/edit/${ModelNameEnum.SalesInvoice}/${name}`);
    },
    async openInvoiceList() {
      const filters = JSON.stringify({
        submitted: 1,
        cancelled: 0,
        outstandingAmount: ['>', 0],
      });
      await routeTo({
        path: `/list/${ModelNameEnum.SalesInvoice}/Overdue Invoices`,
        query: { filters },
      });
    },
  },
});
</script>
