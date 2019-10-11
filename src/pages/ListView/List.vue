<template>
  <div class="px-8 pb-8 mt-2 text-sm flex flex-col justify-between">
    <div>
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
    <div class="flex items-center justify-center">
      <Button :class="start == 0 && 'text-gray-600'" :disabled="start == 0" @click="prevPage">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 feather feather-chevron-left"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Button>
      <div class="mx-3">
        <span class="font-medium">{{ start + data.length }}</span>
        <span class="text-gray-600">of</span>
        <span class="font-medium">{{ totalCount }}</span>
      </div>
      <Button :class="start + 10 >= totalCount && 'text-gray-600'" :disabled="start + 10 >= totalCount" @click="nextPage">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 feather feather-chevron-right"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Button>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import ListRow from './ListRow';
import ListCell from './ListCell';
import Button from '@/components/Button';

export default {
  name: 'List',
  props: ['listConfig', 'filters'],
  components: {
    ListRow,
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
      data: [],
      start: 0,
      pageLength: 10,
      totalCount: null
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
        start: this.start,
        limit: this.pageLength
      });
      let result = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['count(*) as count']
      });
      this.totalCount = result[0].count;
    },
    prevPage() {
      this.start -= 10;
      this.updateData();
    },
    nextPage() {
      this.start += 10;
      this.updateData();
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
