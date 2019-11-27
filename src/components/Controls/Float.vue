<script>
import Int from './Int';

export default {
  name: 'Float',
  extends: Int,
  methods: {
    parse(value) {
      return parseFloat(value);
    }
  }
};
</script>
