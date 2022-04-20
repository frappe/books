<template>
  <div class="flex flex-col max-w-full">
    <PageHeader>
      <template #title>
        <h1 class="text-2xl font-bold">{{ report.title }}</h1>
      </template>
      <template #actions>
        <DropdownWithActions
          v-for="group of actionGroups"
          :key="group.label"
          :type="group.type"
          :actions="group.actions"
          class="ml-2 text-xs"
        >
          {{ group.label }}
        </DropdownWithActions>
        <DropdownWithActions class="ml-2" :actions="actions" />
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="flex px-8 mt-2 text-base" v-if="report.filterFields">
      <div
        class="w-40 ml-2 first:ml-0"
        :class="
          df.fieldtype === 'Check' &&
          'flex justify-between items-center bg-gray-100 px-2 rounded'
        "
        v-for="df in report.filterFields"
        :key="df.fieldname"
      >
        <div v-if="df.fieldtype === 'Check'" class="text-sm mr-2">
          {{ df.label }}
        </div>
        <FormControl
          size="small"
          input-class="bg-gray-100"
          :df="df"
          :value="filters[df.fieldname]"
          @change="(value) => onFilterChange(df, value)"
        />
      </div>
    </div>
    <div class="px-8 mt-4">
      <div>
        <div ref="header" class="overflow-hidden">
          <Row gap="2rem" :grid-template-columns="gridTemplateColumns">
            <div
              class="py-4 text-base truncate"
              :class="[
                getColumnAlignClass(column),
                loading ? 'text-gray-100' : 'text-gray-600',
              ]"
              v-for="column in columns"
              :key="column.label"
            >
              <span :class="{ 'bg-gray-100': loading }">
                {{ column.label }}
              </span>
            </div>
          </Row>
        </div>
        <WithScroll
          @scroll="onBodyScroll"
          class="flex-1 overflow-auto"
          :style="`height: ${height}`"
        >
          <Row
            v-show="row.isShown"
            v-for="(row, i) in rows.slice(sliceIndex.from, sliceIndex.to)"
            :key="i"
            gap="2rem"
            :grid-template-columns="gridTemplateColumns"
          >
            <div
              class="py-4 text-base overflow-scroll no-scrollbar"
              :class="getCellClasses(row, column)"
              v-for="column in columns"
              :key="column.label"
              @click="toggleChildren(row, i)"
            >
              <div class="inline-flex">
                <feather-icon
                  v-if="row.isBranch && !row.isLeaf && column === columns[0]"
                  class="flex-shrink-0 w-4 h-4 mr-2"
                  :name="row.expanded ? 'chevron-down' : 'chevron-right'"
                />
                <span class="truncate" :class="{ 'bg-gray-100': loading }">
                  <component
                    :is="cellComponent(row[column.fieldname], column)"
                  />
                </span>
              </div>
            </div>
          </Row>
        </WithScroll>
        <div
          v-if="usePagination"
          class="flex w-full justify-center mt-2.5 text-base"
        >
          <div class="flex justify-center items-center gap-1 text-gray-800">
            <feather-icon
              name="chevron-left"
              class="text-gray-600 w-4 h-4 cursor-pointer"
              v-show="pageNo > 1"
              @click="pageNo -= 1"
            />
            <div class="w-4 h-4" v-show="pageNo <= 1" />
            <div class="flex gap-1 bg-gray-100 rounded pr-2">
              <input
                type="number"
                class="
                  w-6
                  text-right
                  outline-none
                  bg-transparent
                  focus:text-gray-900
                "
                v-model="pageNo"
                min="1"
                max="maxPages"
              />
              <p class="text-gray-600">/</p>
              <p class="w-5">{{ maxPages }}</p>
            </div>
            <div class="w-4 h-4" v-show="pageNo >= maxPages" />
            <feather-icon
              name="chevron-right"
              class="text-gray-600 w-4 h-4 cursor-pointer"
              v-show="pageNo < maxPages"
              @click="pageNo += 1"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappe';
import reportViewConfig from 'src/../reports/view';
import Button from 'src/components/Button';
import FormControl from 'src/components/Controls/FormControl';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import PageHeader from 'src/components/PageHeader';
import Row from 'src/components/Row';
import SearchBar from 'src/components/SearchBar';
import WithScroll from 'src/components/WithScroll';
import { h, markRaw } from 'vue';
import { getReportData } from '../../reports/index';
import DropdownWithActions from '../components/DropdownWithActions.vue';

export default {
  name: 'Report',
  props: ['reportName', 'defaultFilters'],
  components: {
    PageHeader,
    Button,
    SearchBar,
    Row,
    FormControl,
    WithScroll,
    DropdownWithActions,
    FeatherIcon,
  },
  provide() {
    return {
      doc: this.filters,
    };
  },
  data() {
    let filters = {};
    for (let df of reportViewConfig[this.reportName].filterFields) {
      filters[df.fieldname] = null;
    }

    return {
      loading: true,
      filters,
      pageNo: 1,
      pageLen: 25,
      reportData: {
        rows: [],
        columns: [],
      },
    };
  },
  async activated() {
    this.reportData.columns = this.report.getColumns({ filters: this.filters });
    await this.setDefaultFilters();
    await this.fetchReportData();
  },
  methods: {
    onBodyScroll({ scrollLeft }) {
      this.$nextTick(() => {
        this.$refs.header.scrollLeft = scrollLeft;
      });
    },
    async fetchReportData() {
      let data = await getReportData(this.report.method, this.filters)

      let rows;
      if (data.rows) {
        rows = data.rows;
      } else {
        rows = data;
      }

      this.reportData.columns = markRaw(
        this.report.getColumns({
          filters: this.filters,
          data,
        })
      );

      if (!rows) {
        rows = [];
      }

      this.reportData.rows = markRaw(this.addTreeMeta(rows));
      this.loading = false;
    },

    addTreeMeta(rows) {
      return rows.map((row) => {
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

    async resetFilters() {
      await this.setDefaultFilters();
      await this.fetchReportData();
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
        cellValue != null && cellValue !== ''
          ? frappe.format(cellValue, column)
          : '';
      return {
        render() {
          return h('span', formattedValue);
        },
      };
    },

    getColumnAlignClass(column) {
      return {
        'text-right': ['Int', 'Float', 'Currency'].includes(column.fieldtype),
      };
    },

    getCellClasses(row, column) {
      let padding = ['pl-0', 'pl-6', 'pl-12', 'pl-18', 'pl-20'];
      let treeCellClasses;
      if (row.isBranch && column === this.columns[0]) {
        treeCellClasses = [
          padding[row.indent],
          'hover:bg-gray-100 cursor-pointer',
        ];
      }
      return [
        this.getColumnAlignClass(column),
        treeCellClasses,
        this.loading ? 'text-gray-100' : 'text-gray-900',
      ];
    },
    getReportData() {
      return { rows: this.rows, columns: this.columns, filters: this.filters };
    },
    getCurriedAction(action) {
      return (...args) => action(this.getReportData, ...args);
    },
  },
  computed: {
    usePagination() {
      return (
        this.reportName === 'general-ledger' && this.rows.length > this.pageLen
      );
    },
    height() {
      if (this.usePagination && this.platform === 'Windows') {
        return 'calc(100vh - 14.5rem)';
      } else if (this.usePagination) {
        return 'calc(100vh - 13rem)';
      }
      
      return 'calc(100vh - 12rem)';
    },
    sliceIndex() {
      if (!this.usePagination) {
        return {
          from: 0,
          to: this.rows.length,
        };
      }
      return {
        from: (this.pageNo - 1) * this.pageLen,
        to: this.pageNo * this.pageLen,
      };
    },
    maxPages() {
      return Math.ceil(this.rows.length / this.pageLen);
    },
    actions() {
      return [
        ...(this.report.actions
          ?.filter((action) => !action.group)
          .map((action) =>
            Object.assign({}, action, {
              action: this.getCurriedAction(action.action),
            })
          ) ?? []),
        {
          label: this.t`Reset Filters`,
          action: this.resetFilters,
        },
      ];
    },
    actionGroups() {
      const groups =
        this.report.actions
          ?.filter((action) => action.group)
          .reduce((acc, action) => {
            acc[action.group] ??= { type: action.type, actions: [] };
            const actionWithoutGroup = Object.assign({}, action);
            actionWithoutGroup.action = this.getCurriedAction(action.action);
            delete actionWithoutGroup.group;
            acc[action.group].actions.push(actionWithoutGroup);
            return acc;
          }, {}) ?? {};

      return Object.keys(groups).map((label) => ({ label, ...groups[label] }));
    },
    columns() {
      return this.loading
        ? this.blankStateData.columns
        : this.reportData.columns;
    },
    rows() {
      return this.loading ? this.blankStateData.rows : this.reportData.rows;
    },
    blankStateData() {
      let columns = Array.from(new Array(6)).map((v, i) => {
        return {
          fieldtype: 'Data',
          fieldname: `Test ${i + 1}`,
          label: `Test ${i + 1}`,
        };
      });
      let rows = Array.from(new Array(14)).map(() => {
        return columns.reduce((obj, col) => {
          obj[col.fieldname] = 'Test Data ' + col.fieldname;
          obj.isShown = true;
          return obj;
        }, {});
      });
      return {
        columns,
        rows,
      };
    },
    report() {
      return reportViewConfig[this.reportName];
    },
    columnWidth() {
      return 'minmax(7rem, 1fr)';
    },
    gridTemplateColumns() {
      return this.columns
        .map((col) => {
          let multiplier = col.width;
          if (!multiplier) {
            multiplier = 1;
          }
          let minWidth = `${7 * multiplier}rem`;
          let maxWidth = `${9 * multiplier}rem`;

          return `minmax(${minWidth}, ${maxWidth})`;
        })
        .join(' ');
    },
  },
};
</script>
