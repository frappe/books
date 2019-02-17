<template>
  <div>
    <div class="p-4">
      <h4 class="pb-2">{{ reportConfig.title }}</h4>
      <div class="col-12 text-right mt-4 mb-4">
        <f-button primary @click="openExportWizard">{{ 'Export' }}</f-button>
      </div>
      <report-filters
        v-if="filtersExists"
        :filters="reportConfig.filterFields"
        :filterDefaults="filters"
        @change="getReportData"
      ></report-filters>
      <div class="pt-2" ref="datatable" v-once></div>
    </div>
    <not-found v-if="!reportConfig"/>
  </div>
</template>
<script>
import DataTable from 'frappe-datatable';
import frappe from 'frappejs';
import ReportFilters from 'frappejs/ui/pages/Report/ReportFilters';
import utils from 'frappejs/client/ui/utils';
import ExportWizard from '../../components/ExportWizard';

export default {
  name: 'Report',
  props: ['reportName', 'reportConfig', 'filters'],
  computed: {
    filtersExists() {
      return (this.reportConfig.filterFields || []).length;
    }
  },
  methods: {
    async openExportWizard() {
      this.$modal.show({
        modalProps: {
          title: `Export ${this.reportConfig.title}`,
          noFooter: true
        },
        component: ExportWizard,
        props: await this.getReportDetails()
      });
    },
    async getReportDetails() {
      let { title, filterFields } = this.reportConfig;
      let [rows, columns] = await this.getReportData(filterFields || []);
      let columnData = columns.map(column => {
        return {
          id: column.id,
          content: column.content,
          checked: true
        };
      });
      return {
        title: title,
        rows: rows,
        columnData: columnData
      };
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

      for (let column of columns) {
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
      return [rows, columns];
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
