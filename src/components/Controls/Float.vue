<script>
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
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? 0 : parsedValue;
    },
  },
};
</script>
