<template>
  <div>
    <div class="px-3">
      <div class="row pb-4">
        <page-header :class="linksExists ? 'col-6':'col-12'" :breadcrumbs="breadcrumbs" />
        <report-links class="col-6 d-flex pr-0 flex-row-reverse" v-if="linksExists" :links="links"></report-links>
      </div>
      <div class="row pb-4">
        <report-filters
          class="col-12 pr-0"
          v-if="shouldRenderFields"
          :filterFields="reportConfig.filterFields"
          :filterDoc="filterDoc"
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
import PageHeader from '@/components/PageHeader';
import utils from 'frappejs/client/ui/utils';

export default {
  name: 'Report',
  props: ['reportName', 'reportConfig', 'filters'],
  data() {
    return {
      currentFilters: this.filters,
      filterDoc: undefined,
      links: []
    };
  },
  computed: {
    breadcrumbs() {
      return [
        {
          title: 'Reports',
          route: '#/reportList'
        },
        {
          title: this.reportConfig.title,
          route: ''
        }
      ];
    },
    shouldRenderFields() {
      return (this.reportConfig.filterFields || []).length && this.filterDoc;
    },
    linksExists() {
      return (this.reportConfig.linkFields || []).length;
    }
  },
  async created() {
    this.setLinks();
    this.filterDoc = await frappe.newCustomDoc(this.reportConfig.filterFields);
  },
  methods: {
    async getReportData(filters) {
      this.currentFilters = filters;
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
        if (rows.length) this.datatable.refresh(rows, columns);
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
    ReportLinks,
    PageHeader
  }
};
</script>
<style>
.datatable {
  font-size: 12px;
}
</style>
