<script lang="ts">
import Data from './Data.vue';
import { defineComponent } from 'vue';
import { safeParseInt } from 'utils/index';

export default defineComponent({
  name: 'Int',
  extends: Data,
  computed: {
    inputType() {
      return 'number';
    },
  },
  methods: {
    parse(value: unknown): number {
      return safeParseInt(value);
    },
  },
});
</script>
