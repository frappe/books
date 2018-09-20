<template>
    <div>
        <div class="p-4">
            <h4 class="pb-2">{{ reportConfig.title }}</h4>
            <report-filters v-if="filtersExists" :filters="reportConfig.filterFields" :filterDefaults="filters" @change="getReportData"></report-filters>
            <div class="pt-2" ref="datatable" v-once></div>
        </div>
        <not-found v-if="!reportConfig" />
    </div>
</template>
<script>
import DataTable from 'frappe-datatable';
import frappe from 'frappejs';
import ReportFilters from './ReportFilters';
import utils from 'frappejs/client/ui/utils';

export default {
  name: 'Report',
  props: ['reportName', 'reportConfig', 'filters'],
  computed: {
    reportColumns() {
      return utils.convertFieldsToDatatableColumns(
        this.reportConfig.getColumns()
      );
    },
    filtersExists() {
      return (this.reportConfig.filterFields || []).length;
    }
  },
  methods: {
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
        columns = data.columns;
      }

      if (!rows) {
        rows = [];
      }

      if (!columns) {
        columns = this.reportColumns;
      }

      for(let column of columns) {
         column.editable = false;
      }

      if (this.datatable) {
        this.datatable.refresh(rows, columns);
      } else {
        this.datatable = new DataTable(this.$refs.datatable, {
          columns: columns,
          data: rows
        });
      }
    }
  },
  components: {
    ReportFilters
  }
};
</script>
<style>
</style>
