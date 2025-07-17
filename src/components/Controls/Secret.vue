<script lang="ts">
import Base from './Base.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Secret',
  extends: Base,
  computed: {
    inputType() {
      return 'password';
    },
  },
});
</script>
