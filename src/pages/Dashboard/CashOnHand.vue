<template>
  <div class="flex flex-col h-full">
    <SectionHeader>
      <template #title>{{ t`Cash on Hand` }}</template>
    </SectionHeader>

    <div
      class="mt-4 flex flex-col items-center justify-center flex-1 gap-1 py-6"
    >
      <p
        class="text-4xl font-bold tabular-nums"
        :class="
          total >= 0
            ? 'text-gray-900 dark:text-white'
            : 'text-pink-500 dark:text-pink-400'
        "
      >
        {{ fyo.format(total, 'Currency') }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ t`Across all cash & bank accounts` }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import BaseDashboardChart from './BaseDashboardChart.vue';
import SectionHeader from './SectionHeader.vue';

export default defineComponent({
  name: 'CashOnHand',
  components: { SectionHeader },
  extends: BaseDashboardChart,
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return {
      total: 0 as number,
    };
  },
  methods: {
    async setData() {
      const result = await fyo.db.getCashOnHand();
      this.total = result?.total ?? 0;
    },
  },
});
</script>
