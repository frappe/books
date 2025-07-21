<script>
import { t } from 'fyo';
import Badge from 'src/components/Badge.vue';
import { fyo } from 'src/initFyo';
import { fuzzyMatch } from 'src/utils';
import { getCreateFiltersFromListViewFilters } from 'src/utils/misc';
import { markRaw } from 'vue';
import AutoComplete from './AutoComplete.vue';

export default {
  name: 'MultiLabelLink',
  extends: AutoComplete,
  data() {
    return { results: [] };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.setLinkValue(newValue);
      },
    },
  },
  props: {
    thirdLink: String,
    showSecondaryLink: {
      type: Boolean,
      default: false,
    },
    secondaryLink: String,
    showClearButton: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    if (this.value) {
      this.setLinkValue();
    }
  },
  methods: {
    async setLinkValue(newValue, isInput) {
      if (isInput) {
        return (this.linkValue = newValue || '');
      }

      const value = newValue ?? this.value;
      const { fieldname, target } = this.df ?? {};
      const linkDisplayField = fyo.schemaMap[target ?? '']?.linkDisplayField;

      if (!linkDisplayField) {
        return (this.linkValue = value);
      }

      const linkDoc = await this.doc?.loadAndGetLink(fieldname);
      this.linkValue = linkDoc?.get(linkDisplayField) ?? '';
    },
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

      const baseFields = [
        'name',
        this.secondaryLink,
        schema.titleField,
        this.df.groupBy,
      ].filter(Boolean);

      try {
        const tableInfo = await fyo.db.getSchemaInfo(schemaName);
        if (tableInfo.columns.barcode) {
          baseFields.push('barcode');
        }
      } catch (error) {
        console.debug('Could not check for barcode column', error);
      }

      const results = await fyo.db.getAll(schemaName, {
        filters,
        fields: baseFields,
      });

      return (this.results = results
        .map((r) => {
          const option = {
            label:
              r[this.secondaryLink] && this.showSecondaryLink
                ? `${r[schema.titleField]}  ${r[this.secondaryLink]}`
                : r[schema.titleField],
            value: r.name,
            value2: r[this.secondaryLink],
            barcode: r.barcode || null,
          };

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
        const hasBarcode = options.some(
          (opt) => opt.barcode !== undefined && opt.barcode !== null
        );
        if (hasBarcode) {
          const barcodeMatch = options.find((opt) => opt.barcode === keyword);
          if (barcodeMatch) return [barcodeMatch];
        }

        options = options
          .map((item) => {
            const searchString = `${item.label} ${item.barcode || ''}`;
            return {
              ...fuzzyMatch(keyword, searchString),
              item,
            };
          })
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
                '<span class="text-gray-600 dark:text-gray-400">{{ t`No results found` }}</span>',
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
            '<Badge color="blue" class="ms-2" v-if="isNewValue">{{ linkValue }}</Badge>' +
            '</div>',
          computed: {
            value: () => this.value,
            linkValue: () => this.linkValue,
            isNewValue: () => {
              const values = this.suggestions.map((d) => d.label);
              return this.linkValue && !values.includes(this.linkValue);
            },
          },
          components: { Badge },
        }),
      };
    },
    async openNewDoc() {
      const schemaName = this.df.target;
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
    async getCreateFilters() {
      const { schemaName, fieldname } = this.df;

      const getCreateFilters =
        fyo.models[schemaName]?.createFilters?.[fieldname];
      let createFilters = await getCreateFilters?.(this.doc);

      if (createFilters !== undefined) {
        return createFilters;
      }

      const filters = await this.getFilters();
      return getCreateFiltersFromListViewFilters(filters);
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
