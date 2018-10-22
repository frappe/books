<template>
  <div class="list-container">
    <list-row class="text-muted rounded-top bg-light">
      <list-cell v-for="column in columns" :key="column.label">
        {{ column.label }}
      </list-cell>
    </list-row>
    <list-row v-for="doc in data" :key="doc.name" @click.native="openForm(doc.name)">
      <list-cell v-for="column in columns" :key="column.label">
        {{ frappe.format(column.getValue(doc), column.fieldtype || {}) }}
      </list-cell>
    </list-row>
  </div>
</template>
<script>
import ListRow from './ListRow';
import ListCell from './ListCell';

export default {
  name: 'List',
  props: ['doctype'],
  watch: {
    doctype(oldValue, newValue) {
      if (oldValue !== newValue) {
        this.setupColumnsAndData();
      }
    }
  },
  components: {
    ListRow,
    ListCell
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
      this.prepareColumns();
      this.updateData();
    },
    openForm(name) {
      this.$router.push(`/edit/${this.doctype}/${name}`);
    },
    async updateData(keywords) {
      let filters = null;
      if (keywords) {
        filters = {
          keywords: ['like', keywords]
        }
      }
      this.data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters
      });
    },
    prepareColumns() {
      this.columns = this.meta.listView.columns.map(col => {
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
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    }
  }
};
</script>
