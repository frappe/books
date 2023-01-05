<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      period: 'This Year',
      periodOptions: ['This Year', 'This Quarter', 'This Month'],
    };
  },
  props: {
    commonPeriod: String,
  },
  watch: {
    period: 'periodChange',
    commonPeriod(val) {
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
    async setData() {},
  },
});
</script>
