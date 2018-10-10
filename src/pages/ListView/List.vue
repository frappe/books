<template>
  <div class="list-container">
    <list-row class="text-muted rounded-top bg-light">
      <list-cell v-for="column in columns" :key="column.label">
        {{ column.label }}
      </list-cell>
    </list-row>
    <list-row v-for="doc in data" :key="doc.name" @click.native="openForm(doc.name)">
      <list-cell v-for="column in columns" :key="column.label">
        {{ column.getValue(doc) }}
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
  async mounted() {
    this.prepareColumns();

    this.data = await frappe.db.getAll({
      doctype: this.doctype,
      fields: ['*']
    });
  },
  methods: {
    openForm(name) {
      console.log(name);
      this.$router.push(`/edit/${this.doctype}/${name}`);
    },
    prepareColumns() {
      this.columns = this.meta.listView.columns.map(col => {
        if (typeof col === 'string') {
          const field = this.meta.getField(col);
          if (!field) return null;
          return {
            label: field.label,
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
