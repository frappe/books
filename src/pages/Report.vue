<template>
  <div class="flex flex-col max-w-full">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">{{ report.title }}</h1>
      <template slot="actions">
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="mt-6 flex text-base px-8" v-if="report.filterFields">
      <div class="ml-3 first:ml-0 w-32" v-for="df in report.filterFields">
        <FormControl
          size="small"
          :background="true"
          :df="df"
          :value="filters[df.fieldname]"
          @change="value => onFilterChange(df, value)"
          :target="
            df.fieldtype === 'DynamicLink' ? filters[df.references] : null
          "
        />
      </div>
    </div>
    <div class="px-8 mt-4">
      <div class="overflow-auto" :style="{ height: 'calc(100vh - 8rem)' }">
        <Row
          :columnCount="columns.length"
          gap="1rem"
          column-width="minmax(200px, 1fr)"
        >
          <div
            class="text-gray-600 text-base truncate py-4"
            v-for="column in columns"
            :key="column.label"
          >
            {{ column.label }}
          </div>
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
              class="text-gray-900 text-base truncate py-4"
              v-for="column in columns"
              :key="column.label"
            >
              <component
                v-if="typeof row[column.fieldname] === 'object'"
                :is="row[column.fieldname]"
              />
              <template v-else>
                {{ frappe.format(row[column.fieldname], column) }}
              </template>
            </div>
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
import FormControl from '@/components/Controls/FormControl';
import reportViewConfig from '@/../reports/view';
import throttle from 'lodash/throttle';

export default {
  name: 'Report',
  props: ['reportName'],
  components: {
    PageHeader,
    Button,
    SearchBar,
    Row,
    FormControl
  },
  provide() {
    return {
      doc: this.filters
    }
  },
  data() {
    let filters = {};
    for (let df of reportViewConfig[this.reportName].filterFields) {
      filters[df.fieldname] = null;
    }

    return {
      filters,
      rows: [],
      columns: []
    };
  },
  async mounted() {
    this.columns = this.report.getColumns();
    await this.setDefaultFilters();
    await this.fetchReportData();
  },
  methods: {
    async fetchReportData() {
      let data = await frappe.call({
        method: this.report.method,
        args: this.filters
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
    },

    onFilterChange(df, value) {
      this.filters[df.fieldname] = value;
      this.fetchReportData();
    },

    async setDefaultFilters() {
      for (let df of this.report.filterFields) {
        let defaultValue = null;
        if (df.default) {
          if (typeof df.default === 'function') {
            defaultValue = await df.default();
          } else {
            defaultValue = df.default;
          }
        }
        this.filters[df.fieldname] = defaultValue;
      }
    }
  },
  computed: {
    report() {
      return reportViewConfig[this.reportName];
    }
  }
};
</script>
