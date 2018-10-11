<template>
  <div>
    <div class="p-4">
        <h4 class="pb-2">{{ _('Data Import') }}</h4>
        <frappe-control
          :docfield="{
            fieldtype: 'Select',
            fieldname: 'referenceDoctype',
            options: ['Select a doctype...', 'ToDo', 'Item', 'Party', 'Invoice']
          }"
          @change="doctype => showTable(doctype)"
        />
        <f-button primary @click="importData">Submit</f-button>
        <f-button @click="addRow" v-if="this.datatable">Add Row</f-button>
        <div class="pt-2" ref="datatable" v-once></div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import DataTable from 'frappe-datatable';
import { convertFieldsToDatatableColumns } from 'frappejs/client/ui/utils';

export default {
  data() {
    return {
      datatable: null,
      rows: [],
      columns: []
    }
  },
  methods: {
    addRow() {
      const row = this.columns.map(c => '');
      this.rows.push(row);
      this.renderTable();
    },
    showTable(doctype) {
      this.doctype = doctype;
      const meta = frappe.getMeta(doctype);
      this.columns = convertFieldsToDatatableColumns(meta.fields);
      this.renderTable();
    },
    renderTable() {
      if (this.datatable) {
        this.datatable.refresh(this.rows, this.columns);
        return;
      }
      this.datatable = new DataTable(this.$refs.datatable, {
        columns: this.columns,
        data: this.rows,
        pasteFromClipboard: true
      });
    },
    importData() {
      let rows = this.datatable.datamanager.getRows();

      rows = rows.filter(row => {
        return row.slice(1).some(cell => cell.content !== '');
      });
      const data = rows.map(row => {
        return row.slice(1).reduce((prev, curr) => {
          prev[curr.column.field.fieldname] = curr.content;
          return prev;
        }, {})
      });
      data.forEach(async d => {
        try {
          await frappe.newDoc(Object.assign(d, {
            doctype: this.doctype,
          })).insert()
        } catch(e) {
          console.log(e);
        }
      })
    }
  }
}
</script>
