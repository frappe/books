<template>
  <div class="px-8 pb-8 mt-2 text-sm">
    <ListRow class="text-gray-700" :columnCount="columns.length">
      <div
        v-for="column in columns"
        :key="column.label"
        class="py-4"
        :class="['Float', 'Currency'].includes(column.fieldtype) ? 'text-right pr-10' : ''"
      >{{ column.label }}</div>
    </ListRow>
    <ListRow
      class="cursor-pointer text-gray-900 hover:text-gray-600"
      v-for="doc in data"
      :key="doc.name"
      @click.native="openForm(doc.name)"
      :columnCount="columns.length"
    >
      <ListCell
        v-for="column in columns"
        :key="column.label"
        :class="['Float', 'Currency'].includes(column.fieldtype) ? 'text-right pr-10' : ''"
        :doc="doc"
        :column="column"
      ></ListCell>
    </ListRow>
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
    frappe.db.on(`change:${this.listConfig.doctype}`, obj => {
      this.updateData();
    });
    frappe.listView.on('filterList', this.updateData.bind(this));
  },
  methods: {
    async setupColumnsAndData() {
      this.doctype = this.listConfig.doctype;
      await this.updateData();
    },
    openForm(name) {
      if (this.listConfig.formRoute) {
        this.$router.push(this.listConfig.formRoute(name));
        return;
      }
      this.$router.push({
        path: `/list/${this.doctype}`,
        query: {
          edit: 1,
          doctype: this.doctype,
          name
        }
      });
    },
    async updateData(filters) {
      if (!filters) filters = this.getFilters();
      // since passing filters as URL params which is String
      filters = this.formatFilters(filters);
      this.data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters,
        orderBy: 'creation',
        limit: 13
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
