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
        />
      </div>
    </div>
    <div class="px-8 mt-4">
      <div>
        <div ref="header" class="overflow-hidden">
          <Row gap="2rem" :grid-template-columns="gridTemplateColumns">
            <div
              class="text-gray-600 text-base truncate py-4"
              :class="{
                'text-right': ['Int', 'Float', 'Currency'].includes(
                  column.fieldtype
                )
              }"
              v-for="column in columns"
              :key="column.label"
            >
              {{ column.label }}
            </div>
          </Row>
        </div>
        <WithScroll @scroll="onBodyScroll">
          <div class="flex-1 overflow-auto" style="height: calc(100vh - 12rem)">
            <Row
              v-show="row.isShown"
              v-for="(row, i) in rows"
              :key="i"
              gap="2rem"
              :grid-template-columns="gridTemplateColumns"
            >
              <div
                class="text-gray-900 text-base truncate py-4"
                :class="getCellClasses(row, column)"
                v-for="column in columns"
                :key="column.label"
                @click="toggleChildren(row, i)"
              >
                <div class="inline-flex">
                  <feather-icon
                    v-if="row.isBranch && !row.isLeaf && column === columns[0]"
                    class="w-4 h-4 mr-2 flex-shrink-0"
                    :name="row.expanded ? 'chevron-down' : 'chevron-right'"
                  />
                  <span class="truncate">
                    <component
                      :is="cellComponent(row[column.fieldname], column)"
                    />
                  </span>
                </div>
              </div>
            </Row>
          </div>
        </WithScroll>
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
import WithScroll from '@/components/WithScroll';
import FormControl from '@/components/Controls/FormControl';
import reportViewConfig from '@/../reports/view';
import throttle from 'lodash/throttle';

export default {
  name: 'Report',
  props: ['reportName', 'defaultFilters'],
  components: {
    PageHeader,
    Button,
    SearchBar,
    Row,
    FormControl,
    WithScroll
  },
  provide() {
    return {
      doc: this.filters
    };
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
    onBodyScroll({ scrollLeft }) {
      this.$refs.header.scrollLeft = scrollLeft;
    },
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

      this.rows = this.addTreeMeta(rows);
    },

    addTreeMeta(rows) {
      return rows.map(row => {
        if ('indent' in row) {
          row.isBranch = true;
          row.expanded = true;
          row.isLeaf = !row.isGroup;
        }
        row.isShown = true;
        return row;
      });
    },

    toggleChildren(row, rowIndex) {
      if (!row.isBranch) return;

      let flag;
      if (row.expanded) {
        row.expanded = false;
        flag = false;
      } else {
        row.expanded = true;
        flag = true;
      }

      let _rows = this.rows.slice(rowIndex + 1);
      for (let _row of _rows) {
        if (row.isBranch && _row.indent > row.indent) {
          _row.expanded = flag;
          _row.isShown = flag;
          continue;
        }
        break;
      }
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

      if (this.defaultFilters) {
        Object.assign(this.filters, this.defaultFilters);
      }
    },

    cellComponent(cellValue, column) {
      if (typeof cellValue === 'object') {
        // cellValue has a component definition
        return cellValue;
      }
      if (column.component) {
        // column has a component definition
        return column.component(cellValue, column);
      }
      // default cell component
      let formattedValue =
        cellValue != null ? frappe.format(cellValue, column) : '';
      return {
        render(h) {
          return h('span', formattedValue);
        }
      };
    },

    getCellClasses(row, column) {
      let padding = ['pl-0', 'pl-6', 'pl-12', 'pl-18', 'pl-20'];
      let treeCellClasses;
      if (row.isBranch && column === this.columns[0]) {
        treeCellClasses = [
          padding[row.indent],
          'hover:bg-gray-100 cursor-pointer'
        ];
      }
      return [
        {
          'text-right': ['Int', 'Float', 'Currency'].includes(column.fieldtype)
        },
        treeCellClasses
      ];
    }
  },
  computed: {
    report() {
      return reportViewConfig[this.reportName];
    },
    columnWidth() {
      return 'minmax(7rem, 1fr)';
    },
    gridTemplateColumns() {
      return this.columns
        .map(col => {
          let multiplier = col.width;
          if (!multiplier) {
            multiplier = 1;
          }
          let minWidth = `${7 * multiplier}rem`;
          let maxWidth = `${1 * multiplier}fr`;

          return `minmax(${minWidth}, ${maxWidth})`;
        })
        .join(' ');
    }
  }
};
</script>
