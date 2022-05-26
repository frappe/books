<script>
import Data from "./Data.vue";

export default {
  name: 'Int',
  extends: Data,
  computed: {
    inputType() {
      return 'number';
    },
  },
  methods: {
    parse(value) {
      const parsedValue = parseInt(value, 10);
      return isNaN(parsedValue) ? 0 : parsedValue;
    },
  },
};
</script>
