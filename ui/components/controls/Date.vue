<script>
import BaseDate from './BaseDate';

export default {
  extends: BaseDate,
  props: {
    config: {
      type: Object,
      default: () => {
        let dateFormat = {
          'dd/MM/yyyy': 'd/m/Y',
          'MM/dd/yyyy': 'm/d/Y',
          'dd-MM-yyyy': 'd-m-Y',
          'MM-dd-yyyy': 'm-d-Y',
          'yyyy-MM-dd': 'Y-m-d'
        };
        let altFormat = dateFormat[frappe.SystemSettings.dateFormat];
        return {
          altInput: true,
          dateFormat: 'Y-m-d',
          altFormat: altFormat
        };
      }
    }
  }
};
</script>
