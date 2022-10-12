<script lang="ts">
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import TabBase from './TabBase.vue';

export default defineComponent({
  extends: TabBase,
  name: 'TabDefaults',
  async mounted() {
    this.doc = await fyo.doc.getDoc('Defaults', 'Defaults', {
      skipDocumentCache: true,
    });
  },
  computed: {
    fields() {
      return this.doc?.schema.fields;
    },
  },
});
</script>
