<template>
  <div class="flex flex-col max-w-full">
    <PageHeader>
      <h1 slot="title" class="text-xl font-bold">{{ report.title }}</h1>
      <template slot="actions">
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="px-8 mt-4">
      <div class="overflow-auto" :style="{height: 'calc(100vh - 6rem)'}">
        <Row :columnCount="columns.length" gap="1rem" column-width="minmax(200px, 1fr)">
          <div
            class="text-gray-600 text-sm truncate py-4"
            v-for="column in columns"
            :key="column.label"
          >{{ column.label }}</div>
        </Row>
        <div class="flex-1">
          <Row
            v-for="(row, i) in rows"
            :columnCount="columns.length"
            gap="1rem"
            :key="i"
            column-width="minmax(200px, 1fr)"
          >
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
