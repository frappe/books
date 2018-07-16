<template>
  <div>
    <div ref="wrapper" class="datatable-wrapper"></div>
    <div class="table-actions mt-1" v-if="!disabled">
      <f-button danger @click="removeCheckedRows" v-if="checkedRows.length">Remove</f-button>
      <f-button light @click="addRow" v-if="!checkedRows.length">Add Row</f-button>
    </div>
  </div>
</template>
<script>
import Vue from 'vue';
import frappe from 'frappejs';
import Observable from 'frappejs/utils/observable';
import DataTable from 'frappe-datatable';
import FrappeControl from './controls/FrappeControl';
import { convertFieldsToDatatableColumns } from 'frappejs/client/ui/utils';

export default {
  props: ['doctype', 'rows', 'disabled'],
  data() {
    return {
      docs: this.getRowDocs(),
      checkedRows: []
    }
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    }
  },
  mounted() {
    this.datatable = new DataTable(this.$refs.wrapper, {
      columns: this.getColumns(),
      data: this.docs,
      layout: 'fluid',
      checkboxColumn: true,
      checkedRowStatus: false,
      events: {
        onCheckRow: () => {
          this.checkedRows = this.datatable.rowmanager
            .getCheckedRows()
            .map(i => parseInt(i, 10));
        }
      },
      getEditor: (colIndex, rowIndex, value, parent) => {

        let inputComponent = null;
        const docfield = this.datatable.getColumn(colIndex).field;

        const fieldWrapper = document.createElement('div');
        parent.appendChild(fieldWrapper);

        const updateData = (fieldname, value) => {
          const docs = this.datatable.datamanager.data;
          const doc = docs[rowIndex];
          doc.set(fieldname, value);
          this.emitChange(doc);
        }

        return {
          initValue() {
            inputComponent = new Vue({
              el: fieldWrapper,
              data() {
                return {
                  docfield,
                  value
                }
              },
              components: {
                FrappeControl
              },
              mounted() {
                this.$el.focus();
              },
              template: `<frappe-control
                :docfield="docfield"
                :value="value"
                @change="value => updateValue(docfield.fieldname, value)"
                :onlyInput="true"
              />`,
              methods: {
                updateValue(fieldname, value) {
                  this.value = value;
                  updateData(fieldname, value);
                }
              }
            })
          },
          setValue: (value, rowIndex, column) => {
            inputComponent.value = value;
          },
          getValue: () => {
            return inputComponent.$el.value;
          }
        }
      }
    });
  },
  destroyed() {
    this.datatable.destroy();
  },
  watch: {
    docs: function(newVal, oldVal) {
      this.datatable.refresh(newVal);
    },
    rows: function(newVal, oldVal) {
      this.docs = this.getRowDocs();
    }
  },
  methods: {
    getRowDocs() {
      return (this.rows || []).map((row, i) => {
        const doc = new Observable();
        doc.set('idx', i);
        for (let fieldname in row) {
          doc.set(fieldname, row[fieldname]);
        }
        return doc;
      });
    },
    getColumns() {
      const fieldsToShow = this.meta.fields.filter(df => !df.hidden);
      const columns = convertFieldsToDatatableColumns(fieldsToShow);

      if (this.disabled) {
        columns.forEach(col => col.editable = false);
      }
      return columns;
    },
    addRow() {
      const doc = new Observable();
      doc.set('idx', this.docs.length);
      this.docs.push(doc);
    },
    removeCheckedRows() {
      this.removeRows(this.checkedRows);
      this.checkedRows = [];
      this.datatable.rowmanager.checkAll(false);
    },
    removeRows(indices) {
      // convert to array
      if (!Array.isArray(indices)) {
        indices = [indices];
      }
      // convert string to number
      indices = indices.map(i => parseInt(i, 10));
      // filter
      this.docs = this.docs.filter(doc => !indices.includes(parseInt(doc.idx, 10)));
      // recalculate idx
      this.docs.forEach((doc, i) => {
        doc.set('idx', i);
      });
    },
    emitChange(doc) {
      this.$emit('update:rows', this.docs, doc);
    }
  }
}
</script>
<style lang="scss">
@import "~frappe-datatable/dist/frappe-datatable.css";

.datatable-wrapper {
  .form-control {
    border: none;
    box-shadow: none;
    height: 100%;
    padding: 0;
  }

  .awesomplete > ul {
    position: fixed;
    top: auto;
    left: auto;
    width: auto;
    min-width: 120px;
  }
}
</style>
