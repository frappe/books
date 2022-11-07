<script>
import { safeParseFloat } from 'utils/index';
import Int from './Int.vue';

export default {
  name: 'Float',
  extends: Int,
  computed: {
    inputType() {
      return 'number';
    }
  },
  methods: {
    parse(value) {
      return safeParseFloat(value)
    },
  },
};
</script>
