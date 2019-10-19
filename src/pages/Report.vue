<template>
  <div class="flex flex-col">
    <PageHeader>
      <h1 slot="title" class="text-xl font-bold">{{ report.title }}</h1>
      <template slot="actions">
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="flex flex-col flex-1 px-8 mt-4">
      <Row :columnCount="columns.length" gap="1rem">
        <div
          class="text-gray-600 text-sm truncate py-4"
          v-for="column in columns"
          :key="column.label"
        >{{ column.label }}</div>
      </Row>
      <div class="flex-1 overflow-auto">
        <Row v-for="(row, i) in rows" :columnCount="columns.length" gap="1rem" :key="i">
          <div
            class="text-gray-900 text-sm truncate py-4"
            v-for="column in columns"
            :key="column.label"
            v-html="row[column.fieldname]"
          ></div>
        </Row>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import SearchBar from '@/components/SearchBar';
import Row from '@/components/Row';
import reportViewConfig from '@/../reports/view';

export default {
  name: 'Report',
  props: ['reportName'],
  components: {
    PageHeader,
    Button,
    SearchBar,
    Row
  },
  data() {
    return {
      rows: [],
      columns: []
    };
  },
  mounted() {
    this.columns = this.report.getColumns();
    this.fetchReportData();
  },
  methods: {
    async fetchReportData() {
      let data = await frappe.call({
        method: this.report.method,
        args: {
          fromDate: '2019-09-01',
          toDate: '2019-10-31'
        }
      });

      let rows, columns;
      if (data.rows) {
        rows = data.rows;
      } else {
        rows = data;
      }

      if (data.columns) {
        this.columns = this.report.getColumns(data);
      }

      if (!rows) {
        rows = [];
      }

      this.rows = rows;
    }
  },
  computed: {
    report() {
      return reportViewConfig[this.reportName];
    }
  }
};
</script>
