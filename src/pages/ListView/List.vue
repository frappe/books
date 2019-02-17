<template>
  <div class="list-container">
    <list-row class="text-muted rounded-top bg-light">
      <list-cell v-for="column in columns" :key="column.label">
        {{ column.label }}
      </list-cell>
    </list-row>
    <list-row v-for="doc in data" :key="doc.name" @click.native="openForm(doc.name)">
      <list-cell v-for="column in columns" :key="column.label" class="d-flex align-items-center">
        <indicator v-if="column.getIndicator" :color="column.getIndicator(doc)" class="mr-2" />
        <span>{{ frappe.format(column.getValue(doc), column.fieldtype || {}) }}</span>
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
  props: ['listConfig'],
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
      columns: [],
      data: []
    };
  },
  mounted() {
    this.setupColumnsAndData();
    frappe.listView.on('filterList', this.updateData.bind(this));
  },
  methods: {
    setupColumnsAndData() {
      this.doctype = this.listConfig.doctype;
      this.meta = frappe.getMeta(this.doctype);

      this.prepareColumns();
      this.updateData();
    },
    openForm(name) {
      this.$router.push(`/edit/${this.doctype}/${name}`);
    },
    async updateData(keywords) {
      let filters = this.listConfig.filters || null;
      if (keywords) {
        if (!filters) filters = {};
        filters.keywords = ['like', keywords];
      }
      this.data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters
      });
    },
    prepareColumns() {
      this.columns = this.listConfig.columns.map(col => {
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
      }).filter(Boolean);
    }
  }
};
</script>
