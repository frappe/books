<script>
import Int from './Int';

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
      let parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? 0 : parsedValue;
    },
  },
};
</script>
