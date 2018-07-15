<template>
  <form-layout
    :fields="[docfield]"
    :doc="doc"
  />
</template>
<script>
import frappe from 'frappejs';
import SQLite from 'frappejs/backends/sqlite';
import FormLayout from 'frappejs/ui/components/Form/FormLayout';
import Observable from 'frappejs/utils/observable';
import { saveSettings } from '../../electron/settings';

export default {
  name: 'DatabaseSelector',
  components: {
    FormLayout
  },
  data() {
    return {
      docfield: {
        fieldtype: 'File',
        label: 'Select File',
        fieldname: 'file',
        filetypes: ['.db']
      },
      value: null,
      invalid: false
    }
  },
  created() {
    this.doc = new Observable();
  },
  methods: {
    handleChange(fileList) {
      const value = fileList[0].name;
      this.value = value;
    },
    async changeDatabase() {
      if (frappe.db) {
        frappe.db.close();
      }

      const dbPath = this.doc.file[0].path;
      await saveSettings({
        lastDbPath: dbPath
      });
      window.location.reload();
    }
  }
}
</script>
