<script>
import Data from './Data';

export default {
  name: 'Int',
  extends: Data,
  methods: {
    parse(value) {
      return parseInt(value, 10);
    }
  }
};
</script>
