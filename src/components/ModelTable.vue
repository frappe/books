<template>
  <div>
    <div ref="wrapper" class="datatable-wrapper"></div>
    <div class="table-actions mt-1">
      <button type="button" @click="addRow" class="btn btn-sm btn-light border">Add Row</button>
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
  props: ['doctype', 'rows'],
  data() {
    return {
      docs: this.getRowDocs()
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
        return convertFieldsToDatatableColumns(this.meta.fields);
    },
    addRow() {
      const doc = new Observable();
      doc.set('idx', this.docs.length);
      this.docs.push(doc);
    },
    emitChange(doc) {
      this.$emit('update:rows', this.docs, doc);
    }
  }
}
</script>
<style lang="scss">
@import "frappe-datatable/dist/frappe-datatable.css";

.datatable-wrapper {
  .form-control {
    border: none;
    box-shadow: none;
    height: 100%;
    padding: 0;
  }
}
</style>
