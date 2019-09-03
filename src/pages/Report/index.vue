<template>
  <div class="report-view" style="height: 100%">
    <div style="height: 100%">
      <div class="pb-4 d-flex">
        <page-header :breadcrumbs="breadcrumbs" style="flex-grow: 1;" />
        <report-links class="d-flex flex-row-reverse" v-if="linksExists" :links="links"></report-links>
      </div>
      <div class="pl-1">
        <report-filters
          class="col-12"
          v-if="shouldRenderFields"
          :filterFields="reportConfig.filterFields"
          :filterDoc="filterDoc"
          :filterDefaults="filters"
          @change="getReportData"
          :key="usedToReRender"
        ></report-filters>
      </div>
      <div class="pt-2 px-4" style="height: 100%" ref="datatable" v-once></div>
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
      usedToReRender: 0,
      filterDoc: undefined,
      links: []
    };
  },
  computed: {
    breadcrumbs() {
      return [
        {
          title: 'Reports',
          route: ''
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
        if (rows.length) {
          this.datatable.refresh(rows, columns);
        } else {
          // remove all rows form datatable
          this.datatable.wrapper.innerHTML = '';
          this.datatable = undefined;
        }
      } else {
        if (rows.length) {
          this.datatable = new DataTable(this.$refs.datatable, {
            columns: columns,
            data: rows,
            treeView: this.reportConfig.treeView || false,
            cellHeight: 35
          });
        }
      }
      this.setLinks();
      return [rows, columns];
    },
    setLinks() {
      if (this.linksExists) {
        let links = [];
        for (let link of this.reportConfig.linkFields) {
          if (!link.condition || (link.condition && link.condition(this)))
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
.dt-scrollable {
  height: 77vh;
}
.report-view {
  overflow: hidden;
}
</style>
