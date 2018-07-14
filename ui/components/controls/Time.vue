<script>
import BaseDate from './BaseDate';

export default {
  extends: BaseDate,
  props: {
    config: {
      type: Object,
      default: () => ({
        enableTime: true,
        noCalendar: true
      })
    }
  }
};
</script>
