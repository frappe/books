<script>
import frappe from 'frappejs';
import AutoComplete from './AutoComplete';
import Badge from '@/components/Badge';
import { openQuickEdit } from '@/utils';

export default {
  name: 'Link',
  extends: AutoComplete,
  methods: {
    async getSuggestions(keyword = '') {
      let doctype = this.getTarget();
      let meta = frappe.getMeta(doctype);
      let filters = await this.getFilters(keyword);
      if (keyword && !filters.keywords) {
        filters.keywords = ['like', keyword];
      }
      let results = await frappe.db.getAll({
        doctype,
        filters,
        fields: [
          ...new Set([
            'name',
            meta.titleField,
            this.df.groupBy,
            ...meta.getKeywordFields()
          ])
        ].filter(Boolean)
      });
      let createNewOption = this.getCreateNewOption();
      let suggestions = results
        .map(r => {
          let option = { label: r[meta.titleField], value: r.name };
          if (this.df.groupBy) {
            option.group = r[this.df.groupBy];
          }
          return option;
        })
        .concat(this.df.disableCreation ? null : createNewOption)
        .filter(Boolean);

      if (suggestions.length === 0) {
        return [
          {
            component: {
              template: '<span class="text-gray-600">No results found</span>'
            },
            action: () => {}
          }
        ];
      }

      return suggestions;
    },
    getCreateNewOption() {
      return {
        label: 'Create',
        value: 'Create',
        action: () => this.openNewDoc(),
        component: {
          template: `
                <div class="flex items-center font-semibold">{{ _('Create') }}
                  <Badge color="blue" class="ml-2" v-if="isNewValue">{{ linkValue }}</Badge>
                </div>
            `,
          computed: {
            linkValue: () => this.linkValue,
            isNewValue: () => {
              let values = this.suggestions.map(d => d.value);
              return this.linkValue && !values.includes(this.linkValue);
            }
          },
          components: { Badge }
        }
      };
    },
    async getFilters(keyword) {
      if (this.doc) {
        return this.df.getFilters
          ? (await this.df.getFilters(keyword, this.doc)) || {}
          : {};
      }
      return {};
    },
    getTarget() {
      return this.df.target;
    },
    async openNewDoc() {
      let doctype = this.getTarget();
      let doc = await frappe.getNewDoc(doctype);
      let filters = await this.getFilters();
      openQuickEdit({
        doctype,
        name: doc.name,
        defaults: Object.assign({}, filters, {
          name: this.linkValue
        })
      });
      doc.once('afterInsert', () => {
        this.$emit('new-doc', doc);
        this.$router.back();
      });
    }
  }
};
</script>
