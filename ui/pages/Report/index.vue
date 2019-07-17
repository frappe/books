<template>
  <div>
    <div class="p-4">
      <h4 class="pb-2">{{ reportConfig.title }}</h4>
      <div class="row pb-4">
        <report-filters
          :class="linksExists ? 'col-10' : 'col-12'"
          v-if="filtersExists"
          :filters="reportConfig.filterFields"
          :filterDefaults="filters"
          @change="getReportData"
        ></report-filters>
        <report-links class="col-2" v-if="linksExists" :links="links"></report-links>
      </div>
      <div class="pt-2" ref="datatable" v-once></div>
    </div>
    <not-found v-if="!reportConfig" />
  </div>
</template>
<script>
import DataTable from 'frappe-datatable';
import frappe from 'frappejs';
import ReportFilters from './ReportFilters';
import ReportLinks from './ReportLinks';
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
  data() {
    return {
      links: []
    };
  },
  async created() {
    this.setLinks();
    // this.doc.on('change', this.setLinks);
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
          data: rows
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
</style>
