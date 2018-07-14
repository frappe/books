<template>
    <div>
        <div class="p-4">
            <h4 class="pb-2">{{ reportConfig.title }}</h4>
            <report-filters v-if="reportConfig.filterFields.length" :filters="reportConfig.filterFields" :filterDefaults="filters" @change="getReportData"></report-filters>
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
    }
  },
  methods: {
    getReportData(filters) {
      frappe.methods[this.reportConfig.method](filters).then(data => {
        if (this.datatable) {
          this.datatable.refresh(data || []);
        } else {
          this.datatable = new DataTable(this.$refs.datatable, {
            columns: this.reportColumns,
            data: data || []
          });
        }
      });
    }
  },
  components: {
    ReportFilters
  }
};
</script>
<style>
</style>
