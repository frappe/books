<script>
import { t } from 'fyo';
import Badge from 'src/components/Badge.vue';
import { fyo } from 'src/initFyo';
import { fuzzyMatch } from 'src/utils';
import { markRaw } from 'vue';
import AutoComplete from './AutoComplete.vue';

export default {
  name: 'Link',
  extends: AutoComplete,
  emits: ['new-doc'],
  data() {
    return { results: [] };
  },
  mounted() {
    if (this.value) {
      this.linkValue = this.value;
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.linkValue = newValue;
      },
    },
  },
  methods: {
    getTargetSchemaName() {
      return this.df.target;
    },
    async getOptions() {
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
    async getSuggestions(keyword = '') {
      let options = await this.getOptions();

      if (keyword) {
        options = options
          .map((item) => ({ ...fuzzyMatch(keyword, item.label), item }))
          .filter(({ isMatch }) => isMatch)
          .sort((a, b) => a.distance - b.distance)
          .map(({ item }) => item);
      }

      if (this.doc && this.df.create) {
        options = options.concat(this.getCreateNewOption());
      }

      if (options.length === 0 && !this.df.emptyMessage) {
        return [
          {
            component: markRaw({
              template:
                '<span class="text-gray-600">{{ t`No results found` }}</span>',
            }),
            action: () => {},
            actionOnly: true,
          },
        ];
      }

      return options;
    },
    getCreateNewOption() {
      return {
        label: t`Create`,
        action: () => this.openNewDoc(),
        actionOnly: true,
        component: markRaw({
          template:
            '<div class="flex items-center font-semibold">{{ t`Create` }}' +
            '<Badge color="blue" class="ml-2" v-if="isNewValue">{{ linkValue }}</Badge>' +
            '</div>',
          computed: {
            linkValue: () => this.linkValue,
            isNewValue: () => {
              let values = this.suggestions.map((d) => d.value);
              return this.linkValue && !values.includes(this.linkValue);
            },
          },
          components: { Badge },
        }),
      };
    },
    async openNewDoc() {
      const schemaName = this.df.target;
      const doc = await fyo.doc.getNewDoc(schemaName);

      const filters = await this.getCreateFilters();

      const { openQuickEdit } = await import('src/utils/ui');

      openQuickEdit({
        schemaName,
        name: doc.name,
        defaults: Object.assign({}, filters, {
          name: this.linkValue,
        }),
      });

      doc.once('afterSync', () => {
        this.$emit('new-doc', doc);
        this.$router.back();
        this.results = [];
      });
    },
    async getCreateFilters() {
      const { schemaName, fieldname } = this.df;
      const getCreateFilters =
        fyo.models[schemaName]?.createFilters?.[fieldname];
      let createFilters = await getCreateFilters?.(this.doc);

      if (createFilters !== undefined) {
        return createFilters;
      }

      createFilters = {};

      const filters = await this.getFilters();
      for (const key of Object.keys(filters)) {
        const value = filters[key];
        if (value === undefined) {
          continue;
        }

        if (Array.isArray(value)) {
          continue;
        }

        createFilters[key] = value;
      }

      return createFilters;
    },
    async getFilters() {
      const { schemaName, fieldname } = this.df;
      const getFilters = fyo.models[schemaName]?.filters?.[fieldname];

      if (getFilters === undefined) {
        return {};
      }

      if (this.doc) {
        return (await getFilters(this.doc)) ?? {};
      }

      try {
        return (await getFilters()) ?? {};
      } catch {
        return {};
      }
    },
  },
};
</script>
