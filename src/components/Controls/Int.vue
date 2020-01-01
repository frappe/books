<script>
import Data from './Data';

export default {
  name: 'Int',
  extends: Data,
  methods: {
    parse(value) {
      let parsedValue = parseInt(value, 10);
      return isNaN(parsedValue) ? 0 : parsedValue;
    }
  }
};
</script>
