<script>
import { t } from 'fyo';
import Badge from 'src/components/Badge.vue';
import { fyo } from 'src/initFyo';
import { markRaw } from 'vue';
import AutoComplete from './AutoComplete.vue';

export default {
  name: 'Link',
  extends: AutoComplete,
  emits: ['new-doc'],
  mounted() {
    if (this.value) {
      this.linkValue = this.value;
    }
  },
  methods: {
    async getSuggestions(keyword = '') {
      const schemaName = this.df.target;
      const schema = fyo.schemaMap[schemaName];
      const filters = await this.getFilters(keyword);

      if (keyword && !filters.keywords) {
        filters.keywords = ['like', keyword];
      }

      const fields = [
        ...new Set([
          'name',
          schema.titleField,
          this.df.groupBy,
          ...schema.keywordFields,
        ]),
      ].filter(Boolean);

      const results = await fyo.db.getAll(schemaName, {
        filters,
        fields,
      });

      const suggestions = results
        .map((r) => {
          const option = { label: r[schema.titleField], value: r.name };
          if (this.df.groupBy) {
            option.group = r[this.df.groupBy];
          }
          return option;
        })
        .concat(this.getCreateNewOption())
        .filter(Boolean);

      if (suggestions.length === 0) {
        return [
          {
            component: markRaw({
              template:
                '<span class="text-gray-600">{{ t`No results found` }}</span>',
            }),
            action: () => {},
          },
        ];
      }

      return suggestions;
    },
    getCreateNewOption() {
      return {
        label: t`Create`,
        value: 'Create',
        action: () => this.openNewDoc(),
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
      const filters = await this.getFilters();
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
      });
    },
    async getFilters() {
      const { schemaName, fieldname } = this.df;
      const getFilters = fyo.models[schemaName].filters[fieldname];

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
