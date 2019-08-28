<script>
import Float from './Float';
export default {
  extends: Float,
  methods: {
    parse(value) {
      return frappe.format(value, 'Currency');
    },
    validate(value) {
      return !isNaN(frappe.parseNumber(value));
    }
  }
};
</script>
