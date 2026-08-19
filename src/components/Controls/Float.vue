<script lang="ts">
import { safeParseFloat } from 'utils/index';
import { defineComponent } from 'vue';
import Int from './Int.vue';

export default defineComponent({
  name: 'Float',
  extends: Int,
  computed: {
    inputType() {
      return 'number';
    },
  },
  methods: {
    parse(value: unknown): number {
      return safeParseFloat(value);
    },
  },
});
</script>
