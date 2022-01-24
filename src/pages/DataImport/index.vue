<template>
  <div>
    <div class="p-4">
      <h4 class="pb-2">{{ t('Data Import') }}</h4>
      <frappe-control
        :docfield="{
          fieldtype: 'Select',
          fieldname: 'referenceDoctype',
          options: ['Select...', 'Item', 'Party', 'Account'],
        }"
        @change="(doctype) => showTable(doctype)"
      />
      <f-button secondary v-if="doctype" primary @click="uploadCSV"
        >Upload CSV</f-button
      >
      <f-button secondary v-if="doctype" primary @click="downloadCSV"
        >Download CSV Template</f-button
      >
      <f-button primary @click="importData">Submit</f-button>

      <frappe-control
        v-if="doctype"
        ref="fileInput"
        style="position: absolute; display: none"
        :docfield="{
          fieldtype: 'File',
          fieldname: 'CSV File',
        }"
        @change="uploadCSV"
      />
      <div class="pt-2" ref="datatable" v-once></div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappe';
import DataTable from 'frappe-datatable';
import { convertFieldsToDatatableColumns } from 'frappe/client/ui/utils';
import { writeFile } from 'frappe/server/utils';
import path from 'path';
import csv2json from 'csvjson-csv2json';

export default {
  data() {
    return {
      doctype: undefined,
      fileUploaded: false,
    };
  },
  methods: {
    showTable(doctype) {
      this.doctype = doctype;
      const meta = frappe.getMeta(doctype);
      const columns = convertFieldsToDatatableColumns(meta.fields);
      this.renderTable(columns);
    },
    renderTable(columns, rows) {
      if (this.datatable) {
        this.datatable.refresh(rows, columns);
        return;
      }
      this.datatable = new DataTable(this.$refs.datatable, {
        columns,
        data: [[]],
        pasteFromClipboard: true,
      });
    },
    async downloadCSV() {
      const meta = frappe.getMeta(this.doctype);
      let csvString = '';
      for (let field of meta.fields) {
        csvString += field.label + ',';
      }

      const documentsPath =
        process.env.NODE_ENV === 'development'
          ? path.resolve('.')
          : frappe.store.documentsPath;

      let title = frappe.t('Message');
      let message = frappe.t('Template saved successfully.');

      if (documentsPath === undefined) {
        title = frappe.t('Error');
        message = frappe.t('Template could not be saved.');
      } else {
        await writeFile(
          path.resolve(
            documentsPath + `/frappe-accounting/${this.doctype}.csv`
          ),
          csvString
        );
      }

      frappe.call({
        method: 'show-dialog',
        args: { title, message },
      });
    },
    uploadCSV(file) {
      if (file[0]) {
        var reader = new FileReader();
        reader.onload = () => {
          const meta = frappe.getMeta(this.doctype);
          let header = reader.result.split('\n')[0];
          header = header.split(',').map((label) => {
            let fieldname;
            meta.fields.some((field) => {
              if (field.label === label.trim()) {
                fieldname = field.fieldname;
                return true;
              }
            });
            return fieldname;
          });
          let csvString = reader.result.split('\n');
          csvString[0] = header;
          csvString = csvString.join('\n');
          const json = csv2json(csvString, { parseNumbers: true });
          const columns = convertFieldsToDatatableColumns(meta.fields);
          this.renderTable(columns, json);
          this.$refs.fileInput.$children[0].$refs.input.value = '';
        };
        reader.readAsBinaryString(file[0]);
        return;
      }
      //Click the file input
      this.$refs.fileInput.$children[0].$refs.input.click();
    },
    importData() {
      const rows = this.datatable.datamanager.getRows();

      const data = rows.map((row) => {
        return row.slice(1).reduce((prev, curr) => {
          prev[curr.column.field.fieldname] = curr.content;
          return prev;
        }, {});
      });

      data.forEach(async (d) => {
        try {
          await frappe
            .newDoc(
              Object.assign(d, {
                doctype: this.doctype,
              })
            )
            .insert();
        } catch (e) {
          console.log(e);
        }
      });
      frappe.call({
        method: 'show-dialog',
        args: {
          title: 'Message',
          message: `Data Imported Successfully`,
        },
      });
    },
  },
};
</script>
