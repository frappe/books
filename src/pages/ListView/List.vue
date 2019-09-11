<template>
  <div class="list-container">
    <list-row class="text-muted rounded-top border-bottom">
      <list-cell style="max-width: 20px;" class="mx-1 mr-3 text-center">
        <input type="checkbox" />
      </list-cell>
      <list-cell
        v-for="column in columns"
        :key="column.label"
        :class="['Float', 'Currency'].includes(column.fieldtype) ? 'text-right':''"
      >{{ column.label }}</list-cell>
    </list-row>
    <list-row
      v-for="doc in data"
      :key="doc.name"
      @click.native="openForm(doc.name)"
      class="border-bottom"
    >
      <list-cell style="max-width: 20px;" class="ml-1 mr-3">
        <div class="rounded-circle bg-light" style="width: 22px; height: 22px;"></div>
      </list-cell>

      <list-cell v-for="column in columns" :key="column.label" class="d-flex align-items-center">
        <indicator v-if="column.getIndicator" :color="column.getIndicator(doc)" class="mr-2" />
        <span
          style="width: 100%"
          :class="['Float', 'Currency'].includes(column.fieldtype) ? 'text-right':''"
        >{{ getColumnValue(column, doc) }}</span>
      </list-cell>
    </list-row>
  </div>
</template>
<script>
import frappe from 'frappejs';
import ListRow from './ListRow';
import ListCell from './ListCell';

export default {
  name: 'List',
  props: ['listConfig', 'filters'],
  components: {
    ListRow,
    ListCell
  },
  watch: {
    listConfig(oldValue, newValue) {
      if (oldValue.doctype !== newValue.doctype) {
        this.setupColumnsAndData();
      }
    }
  },
  data() {
    return {
      data: []
    };
  },
  computed: {
    columns() {
      return this.prepareColumns();
    },
    meta() {
      return frappe.getMeta(this.listConfig.doctype);
    }
  },
  async mounted() {
    await this.setupColumnsAndData();
    frappe.listView.on('filterList', this.updateData.bind(this));
  },
  methods: {
    getColumnValue(column, doc) {
      // Since currency is formatted in customer currency
      // frappe.format parses it back into company currency
      if (['Float', 'Currency'].includes(column.fieldtype)) {
        return column.getValue(doc);
      } else {
        return frappe.format(column.getValue(doc), column.fieldtype);
      }
    },
    async setupColumnsAndData() {
      this.doctype = this.listConfig.doctype;
      await this.updateData();
    },
    openForm(name) {
      const listName = this.listConfig.listName || this.doctype;
      // this.$router.push(`/list/${listName}/edit/${this.doctype}/${name}`);
      this.$router.push(`/edit/${this.doctype}/${name}`);
    },
    async updateData(filters) {
      if (!filters) filters = this.getFilters();
      // since passing filters as URL params which is String
      filters = this.formatFilters(filters);
      this.data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters
      });
    },
    getFilters() {
      let filters = {};
      Object.assign(filters, this.listConfig.filters || {});
      Object.assign(filters, this.filters);
      return filters;
    },
    formatFilters(filters) {
      for (let key in filters) {
        let value = filters[key];
        this.meta.fields.forEach(field => {
          if (field.fieldname === key) {
            filters[key] = frappe.format(value, field.fieldtype);
          }
        });
      }
      return filters;
    },
    prepareColumns() {
      return this.listConfig.columns
        .map(col => {
          if (typeof col === 'string') {
            const field = this.meta.getField(col);
            if (!field) return null;
            return {
              label: field.label,
              fieldtype: field.fieldtype,
              getValue(doc) {
                return doc[col];
              }
            };
          }
          return col;
        })
        .filter(Boolean);
    }
  }
};
</script>
