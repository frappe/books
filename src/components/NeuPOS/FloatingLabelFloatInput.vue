<script lang="ts">
import { defineComponent } from 'vue';
import FloatingLabelInputBase from './FloatingLabelInputBase.vue';

export default defineComponent({
  name: 'FloatingLabelFloatInput',
  extends: FloatingLabelInputBase,
  computed: {
    inputType() {
      return 'number';
    },
  },
});
</script>
