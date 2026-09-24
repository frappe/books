<script lang="ts">
import { PeriodKey } from 'src/utils/types';
import { PropType } from 'vue';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    commonPeriod: { type: String as PropType<PeriodKey>, default: 'This Year' },
  },
  emits: ['period-change'],
  data() {
    return {
      period: 'This Year' as PeriodKey,
      periodOptions: [
        'This Year',
        'YTD',
        'This Quarter',
        'This Month',
      ] as PeriodKey[],
    };
  },
  watch: {
    period: 'periodChange',
    commonPeriod(val: PeriodKey) {
      if (!this.periodOptions.includes(val)) {
        return;
      }

      this.period = val;
    },
  },
  async mounted() {
    // `activated()` fires when the Dashboard page is re-navigated to (keep-alive),
    // but NOT when a widget first mounts while the dashboard is already active
    // (e.g. after a layout save makes a previously-hidden widget visible).
    // Calling setData() here guarantees data loads on every first mount.
    await this.setData();
  },
  async activated() {
    // Fires when the user navigates back to the Dashboard (keep-alive).
    // Re-fetch so widgets always reflect the latest data.
    await this.setData();
  },
  methods: {
    async periodChange() {
      this.$emit('period-change', this.period);
      await this.setData();
    },
    async setData() {
      return Promise.resolve(null);
    },
  },
});
</script>
