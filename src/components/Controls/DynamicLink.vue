<script>
import { fyo } from 'src/initFyo';
import Link from './Link.vue';
export default {
  name: 'DynamicLink',
  props: ['target'],
  inject: ['report'],
  extends: Link,
  created() {
    const watchKey = `doc.${this.df.references}`;
    this.targetWatcher = this.$watch(watchKey, function (newTarget, oldTarget) {
      if (oldTarget && newTarget !== oldTarget) {
        this.triggerChange('');
      }
    });
  },
  unmounted() {
    this.targetWatcher();
  },
  methods: {
    getTargetSchemaName() {
      const references = this.df.references;
      if (!references) {
        return null;
      }

      let schemaName = this.doc?.[references];
      if (!schemaName) {
        schemaName = this.report?.[references];
      }

      if (!schemaName) {
        return null;
      }

      if (!fyo.schemaMap[schemaName]) {
        return null;
      }

      return schemaName;
    },
  },
};
</script>
