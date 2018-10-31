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
          style="width:30%"
        />
        <f-button primary @click="importData(doctype)" v-if="this.datatable">Submit</f-button>
        <f-button @click="addRow" v-if="this.datatable">Add Row</f-button>
        <br v-if="(success.length>0) && (this.datatable)">
        <br v-if="(success.length>0) && (this.datatable)">
        <br v-if="(success.length>0) && (this.datatable)">
        <div v-if="(success.length>0) && (this.datatable) && (success.length<2)">
          <h5 style="color:green">{{success.length}} row successfully imported.</h5>
        </div>
        <div v-if="(success.length>1) && (this.datatable)">
          <h5 style="color:green"> {{ success.length }} rows successfully imported.</h5>
        </div>
        <br>
        <br>
        <div v-if="(errors.length>0) && (this.datatable)">
          <h5 style="color:red">Error in Importing Data</h5>
          <ul>
            <li v-for="error in this.errors" style="color:red">
              Row {{ error.number }} : {{ error.message }}
            </li>
          </ul>
        </div>
        <div v-if="(validatedCells.length>0) && (this.datatable) && (this.availableOptions.length==0)">
          <h5 style="color:red">Error in Importing Data</h5>
          <ul>
            <li v-for="error in this.validatedCells" style="color:red">
              Row: {{ error.rowIndex }}, Column: {{ error.colIndex }}, Error: {{ error.message}}
            </li>
          </ul>
        </div>
        <div v-if="(validatedCells.length>0) && (this.datatable) && (this.availableOptions.length>0)">
          <h5 style="color:red">Error in Importing Data</h5>
          <ul>
            <li v-for="error in this.validatedCells" style="color:red">
              Row: {{ error.rowIndex }}, Column: {{ error.colIndex }}, Error: {{ error.message}} [ {{ availableOptions.join(", ")}} ]
            </li>
          </ul>
        </div>
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
      rows: new Array(100),
      columns: [],
      errors: [],
      success: [],
      validatedRows: [],
      validatedCells: [],
      availableOptions: []
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
    showErrorTable(doctype, data) {
      this.doctype = doctype;
      const meta = frappe.getMeta(doctype);
      this.columns = convertFieldsToDatatableColumns(meta.fields);
      this.renderErrorTable(data.failure);
    },
    renderTable() {
      for (var i = 0; i < this.rows.length; i++) {
        this.rows[i] = new Array(0);
      }
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
    renderErrorTable(data) {
      this.datatable = new DataTable(this.$refs.datatable, {
        columns: this.columns,
        data: data,
        pasteFromClipboard: true
      });
    },
    importData(doctype) {
      this.errors = []
      this.doctype = doctype
      this.validateRows(this.doctype);
      if(this.validatedCells.length==0) {
        const data = this.validatedRows.map(row => {
          return row.slice(1).reduce((prev, curr) => {
            prev[curr.column.field.fieldname] = curr.content;
            return prev;
          }, {})
        });
        frappe.call({
            method: 'import-data',
            args: { doctype: this.doctype, data }
        }).then((data) => {
          if(data.success.length>0) {
            this.success = data.success.slice()
          }
          let i = 1;
          if(data.failure.length>0) {
            this.showErrorTable(this.doctype, data)
            data.errorMessage.map(e => {
              if(e.errno==19) {
                this.errors.push({
                  message:"already exists",
                  number:i
                })
              }
              else {
                this.errors.push({
                  message:"normie error",
                  number:i
                })
              }
              i++;
            })
          }
          else if (data.failure.length==0) {
            this.showTable(this.doctype)
          }
        })
      }
    },
    validateRows(doctype) {
      let rows = this.datatable.datamanager.getRows().filter(row => {
        return row.slice(1).some(cell => cell.content !== '');
      });
      this.doctype = doctype
      this.validatedCells = []
      this.validatedRows = rows.map(row => {
        return row.map(cell => {
          const field = cell.column.field;
          if (!field) return cell;
          if (field.fieldtype === 'Check') {
            cell.isInvalid = false
            try {
              cell.content = JSON.parse(cell.content);
              if (typeof cell.content !== 'boolean') {
                cell.isInvalid = true;
              }
            } catch(e) {
              cell.isInvalid = true;
            }
            if (cell.isInvalid == true) {
              this.validatedCells.push({
                colIndex: cell.colIndex,
                rowIndex: cell.rowIndex,
                message: "The value entered should be either 'true' or 'false'"
              })
            }
          }
          if (field.fieldtype === 'Select') {
            const meta = frappe.getMeta(doctype);
            const b = meta.getField(field.fieldname)
            if(!(b.options.includes(cell.content))) {
                cell.isInvalid = true
            }
            if (cell.isInvalid = true) {
              this.availableOptions = b.options
              this.validatedCells.push({
                colIndex: cell.colIndex,
                rowIndex: cell.rowIndex,
                message: "The value entered should be one of"
              })
            }
          }
          return cell;
        })
      });

      this.validatedRows.map(row => {
        row.map(cell => {
          if (cell.isInvalid) {
            const $cell = this.datatable.cellmanager.getCell$(cell.colIndex, cell.rowIndex);
            const targetDiv = $cell.querySelector(".dt-cell__content")
            targetDiv.classList.add('border-danger');
          }
        })
      })
    },
    insertDoc(d) {
      return frappe.newDoc(Object.assign(d, {
        doctype: this.doctype,
      })).insert();
    }
  }
}
</script>
