<script lang="ts">
import { defineComponent } from 'vue';
import Datetime from './Datetime.vue';

export default defineComponent({
  data() {
    return { selectTime: false };
  },
  extends: Datetime,
});
</script>
