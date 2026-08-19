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
