<script>
import { fyo } from 'src/initFyo';
import Link from './Link.vue';
export default {
  name: 'DynamicLink',
  extends: Link,
  inject: {
    report: { default: null },
  },
  props: ['target'],
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
      if (this.results?.length) {
        return this.results;
      }

      const schemaNames = this.getTargetSchemas();
      if (schemaNames.length === 0) {
        return [];
      }

      const promises = schemaNames.map(async (schema) => {
        const schemaDef = fyo.schemaMap[schema];
        const filters = await this.getFilters();

        const fields = [
          ...new Set(['name', schemaDef.titleField, this.df.groupBy]),
        ].filter(Boolean);

        return fyo.db.getAll(schema, { filters, fields }).then((res) => {
          return res.map((r) => {
            const option = { label: r[schemaDef.titleField], value: r.name };
            if (this.df.groupBy) {
              option.group = r[this.df.groupBy];
            }
            if (schemaNames.length > 1) {
              option.label = `${option.label} (${schemaDef.label || schema})`;
            }
            return option;
          });
        });
      });

      const results = (await Promise.all(promises)).flat();
      return (this.results = results.filter(Boolean));
    },
    getTargetSchemas() {
      const singleSchema = this.getTargetSchemaName();
      if (singleSchema) {
        return [singleSchema];
      }

      const references = this.df.references;
      const refValue = this.doc?.[references] || this.report?.[references];

      if (refValue === 'All' && references) {
        let options = [];
        if (this.report?.filters) {
          const field = this.report.filters.find(
            (f) => f.fieldname === references
          );
          if (field?.options) options = field.options;
        }

        if (options.length) {
          return options
            .map((o) => o.value)
            .filter((val) => val !== 'All' && fyo.schemaMap[val]);
        }
      }

      return [];
    },
    async openNewDoc() {
      const schemaName = this.getTargetSchemaName();
      if (!schemaName) {
        return;
      }
      const name =
        this.linkValue || fyo.doc.getTemporaryName(fyo.schemaMap[schemaName]);
      const filters = await this.getCreateFilters();
      const { openQuickEdit } = await import('src/utils/ui');

      const doc = fyo.doc.getNewDoc(schemaName, { name, ...filters });
      openQuickEdit({ doc });

      doc.once('afterSync', () => {
        this.$router.back();
        this.results = [];
        this.triggerChange(doc.name);
      });
    },
  },
};
</script>
