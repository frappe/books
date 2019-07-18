<template>
  <div>
    <div class="p-4">
      <div class="row pb-4">
        <h4 class="col-6 d-flex">{{ reportConfig.title }}</h4>
        <report-links class="col-6 d-flex pr-0 flex-row-reverse" v-if="linksExists" :links="links"></report-links>
      </div>
      <div class="row pb-4">
        <report-filters
          class="col-12 pr-0"
          v-if="filtersExists"
          :filters="reportConfig.filterFields"
          :filterDefaults="filters"
          @change="getReportData"
        ></report-filters>
      </div>
      <div class="pt-2 pr-3" ref="datatable" v-once></div>
    </div>
    <not-found v-if="!reportConfig" />
  </div>
</template>
<script>
import DataTable from 'frappe-datatable';
import frappe from 'frappejs';
import ReportFilters from 'frappejs/ui/pages/Report/ReportFilters';
import ReportLinks from 'frappejs/ui/pages/Report/ReportLinks';
import utils from 'frappejs/client/ui/utils';

export default {
  name: 'Report',
  props: ['reportName', 'reportConfig', 'filters'],
  computed: {
    filtersExists() {
      return (this.reportConfig.filterFields || []).length;
    },
    linksExists() {
      return (this.reportConfig.linkFields || []).length;
    }
  },
  watch: {
    reportName() {
      //FIX: Report's data forwards to next consecutively changed report
      this.getReportData(this.filters);
    }
  },
  data() {
    return {
      links: []
    };
  },
  async created() {
    this.setLinks();
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
          data: rows,
          treeView: this.reportConfig.treeView || false,
          cellHeight: 35
        });
      }
      return [rows, columns];
    },
    setLinks() {
      if (this.linksExists) {
        let links = [];
        for (let link of this.reportConfig.linkFields) {
          links.push({
            label: link.label,
            handler: () => {
              link.action(this);
            }
          });
        }
        this.links = links;
      }
    },
    getColumns(data) {
      const columns = this.reportConfig.getColumns(data);
      return utils.convertFieldsToDatatableColumns(columns);
    }
  },
  components: {
    ReportFilters,
    ReportLinks
  }
};
</script>
<style>
.datatable {
  font-size: 12px;
}
</style>
