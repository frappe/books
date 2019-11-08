<template>
  <div class="px-5 pb-16 mt-2 text-sm flex flex-col overflow-y-hidden">
    <div class="px-3">
      <Row class="text-gray-700" :columnCount="columns.length" gap="1rem">
        <div
          v-for="column in columns"
          :key="column.label"
          class="py-4 truncate"
          :class="['Float', 'Currency'].includes(column.fieldtype) ? 'text-right' : ''"
        >{{ column.label }}</div>
      </Row>
    </div>
    <div class="overflow-y-auto">
      <div class="px-3 hover:bg-gray-100 rounded" v-for="doc in data" :key="doc.name">
        <Row
          gap="1rem"
          class="cursor-pointer text-gray-900"
          @click.native="openForm(doc.name)"
          :columnCount="columns.length"
        >
          <ListCell
            v-for="column in columns"
            :key="column.label"
            :class="['Float', 'Currency'].includes(column.fieldtype) ? 'text-right' : ''"
            :doc="doc"
            :column="column"
          ></ListCell>
        </Row>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Row from '@/components/Row';
import ListCell from './ListCell';
import Button from '@/components/Button';

export default {
  name: 'List',
  props: ['listConfig', 'filters'],
  components: {
    Row,
    ListCell,
    Button
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
        orderBy: 'creation'
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
