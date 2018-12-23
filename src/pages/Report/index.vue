<template>
    <div>
        <div class="p-4">
            <h4 class="pb-2">{{ reportConfig.title }}</h4>
            <div class="col-12 text-right mt-4 mb-4">
              <f-button primary @click="exportData">{{ 'Export' }}</f-button>
            </div>
            <report-filters v-if="filtersExists" :filters="reportConfig.filterFields" :filterDefaults="filters" @change="getReportData"></report-filters>
            <div class="pt-2" ref="datatable" v-once></div>
        </div>
        <not-found v-if="!reportConfig" />
    </div>
</template>
<script>
import DataTable from 'frappe-datatable';
import frappe from 'frappejs';
import ReportFilters from 'frappejs/ui/pages/Report/ReportFilters';
import utils from 'frappejs/client/ui/utils';
import path from 'path';
const { writeFile } = require('frappejs/server/utils');

export default {
  name: 'Report',
  props: ['reportName', 'reportConfig', 'filters'],
  computed: {
    filtersExists() {
      return (this.reportConfig.filterFields || []).length;
    }
  },
  methods: {
    async exportData() {
      let { title, filterFields } = this.reportConfig;
      console.log(title, filterFields);
      let [rows, columns] = await this.getReportData(filterFields || []);
      let columnNames = columns.map((column)=>column.content).toString();
      let columnIDs = columns.map((column)=>column.id);
      let rowData = rows.map((row)=>columnIDs.map((id)=>row[id]).toString());
      let csvDataArray = [columnNames, ...rowData];
      let csvData = csvDataArray.join('\n');
      // console.log(csvData);
      let d = new Date();
      if(localStorage.dbPath) {
        let fileName = [
          title.replace(/\s/g,'-'),
          [d.getDate(),d.getMonth(),d.getFullYear()].join('-'),
          `${d.getTime()}.csv`
        ].join('_');
        let dbPath = localStorage.dbPath;
        let dbFilePath = dbPath.substring(0,
          dbPath.length - dbPath.split('').reverse().join('').indexOf('/') - 1
        )
        // console.log(dbFilePath);
        let filePath = path.join(dbFilePath, fileName);
        await writeFile(filePath, csvData);
        alert(`CSV File saved at ${filePath}`);
      } else {
        alert('DB Filepath not set!');
      }
    },
    async getReportData(filters) {
      let data = await frappe.call({
          method: this.reportConfig.method,
          args: filters
      });

      let rows, columns;
      if (data.rows) {
        rows = data.rows;
      } else {
        rows = data;
      }

      if (data.columns) {
        columns = this.getColumns(data);
      }

      if (!rows) {
        rows = [];
      }

      if (!columns) {
        columns = this.getColumns();
      }

      for(let column of columns) {
         column.editable = false;
      }

      console.log(rows);
      console.log(columns);

      if (this.datatable) {
        this.datatable.refresh(rows, columns);
      } else {
        this.datatable = new DataTable(this.$refs.datatable, {
          columns: columns,
          data: rows
        });
      }
      return [rows,columns];
    },
    getColumns(data) {
      const columns = this.reportConfig.getColumns(data);
      return utils.convertFieldsToDatatableColumns(columns);
    }
  },
  components: {
    ReportFilters
  }
};
</script>
<style>
</style>
