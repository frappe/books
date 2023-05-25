<script>
import { fyo } from 'src/initFyo';
import Link from './Link.vue';
export default {
  name: 'DynamicLink',
  props: ['target'],
  inject: {
    report: { default: null },
  },
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
    async getOptions() {
      this.results = [];
      const schemaName = this.getTargetSchemaName();
      if (!schemaName) {
        return [];
      }

      if (this.results?.length) {
        return this.results;
      }

      const schema = fyo.schemaMap[schemaName];
      const filters = await this.getFilters();

      const fields = [
        ...new Set(['name', schema.titleField, this.df.groupBy]),
      ].filter(Boolean);

      const results = await fyo.db.getAll(schemaName, {
        filters,
        fields,
      });
      return (this.results = results
        .map((r) => {
          const option = { label: r[schema.titleField], value: r.name };
          if (this.df.groupBy) {
            option.group = r[this.df.groupBy];
          }
          return option;
        })
        .filter(Boolean));
    },
  },
};
</script>
