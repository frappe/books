<template>
  <div class="flex flex-col max-w-full">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">{{ report.title }}</h1>
      <template slot="actions">
        <Button
          :icon="true"
          @click="downloadAsJson"
          type="primary"
          v-if="isGstReportsPage"
          class="ml-2 text-white text-xs"
        >
          {{ _('Download as JSON') }}
        </Button>
        <SearchBar class="ml-2" />
      </template>
    </PageHeader>
    <div class="flex px-8 mt-2 text-base" v-if="report.filterFields">
      <div
        class="w-40 ml-2 first:ml-0"
        :class="
          df.fieldtype === 'Check' &&
          'flex justify-between items-center bg-gray-100 px-2 overflow-scroll rounded'
        "
        v-for="df in report.filterFields"
        :key="df.fieldname"
      >
        <div v-if="df.fieldtype === 'Check'" class="text-gray-900 text-sm">
          {{ df.label }}
        </div>
        <FormControl
          size="small"
          input-class="bg-gray-100"
          :df="df"
          :value="filters[df.fieldname]"
          @change="(value) => onFilterChange(df, value)"
          :show-label="df.fieldtype === 'Check'"
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
        <WithScroll @scroll="onBodyScroll">
          <div class="flex-1 overflow-auto report-scroll-container">
            <Row
              v-show="row.isShown"
              v-for="(row, i) in rows"
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
import { makeJSON } from '@/utils';
import { ipcRenderer } from 'electron';
import { IPC_ACTIONS } from '@/messages';
import { DateTime } from 'luxon';
import { sleep } from 'frappejs/utils';

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
      reportData: {
        rows: [],
        columns: [],
      },
      printSettings: null,
    };
  },
  async activated() {
    this.reportData.columns = this.report.getColumns();
    await this.setDefaultFilters();
    await this.fetchReportData();
  },
  async mounted() {
    this.printSettings = await frappe.getSingle('PrintSettings');
  },
  methods: {
    onBodyScroll({ scrollLeft }) {
      this.$nextTick(() => {
        this.$refs.header.scrollLeft = scrollLeft;
      });
    },
    async fetchReportData() {
      let data = await frappe.call({
        method: this.report.method,
        args: this.filters,
      });

      let rows;
      if (data.rows) {
        rows = data.rows;
      } else {
        rows = data;
      }

      if (data.columns) {
        this.reportData.columns = this.report.getColumns(data);
      }

      if (!rows) {
        rows = [];
      }

      this.reportData.rows = this.addTreeMeta(rows);
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
        render(h) {
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
    async downloadAsJson() {
      const savePath = await this.getSavePath();
      if (!savePath) return;

      const gstRates = {
        'GST-0': 0,
        'GST-0.25': 0.25,
        'GST-3': 3,
        'GST-5': 5,
        'GST-6': 6,
        'GST-12': 12,
        'GST-18': 18,
        'GST-28': 28,
        'IGST-0': 0,
        'IGST-0.25': 0.25,
        'IGST-3': 3,
        'IGST-5': 5,
        'IGST-6': 6,
        'IGST-12': 12,
        'IGST-18': 18,
        'IGST-28': 28,
      };

      const csgstRates = {
        'GST-0': 0,
        'GST-0.25': 0.125,
        'GST-3': 1.5,
        'GST-5': 2.5,
        'GST-6': 3,
        'GST-12': 6,
        'GST-18': 9,
        'GST-28': 14,
        'IGST-0': 0,
        'IGST-0.25': 0,
        'IGST-3': 0,
        'IGST-5': 0,
        'IGST-6': 0,
        'IGST-12': 0,
        'IGST-18': 0,
        'IGST-28': 0,
      };

      const igstRates = {
        'GST-0': 0,
        'GST-0.25': 0,
        'GST-3': 0,
        'GST-5': 0,
        'GST-6': 0,
        'GST-12': 0,
        'GST-18': 0,
        'GST-28': 0,
        'IGST-0': 0,
        'IGST-0.25': 0.25,
        'IGST-3': 3,
        'IGST-5': 5,
        'IGST-6': 6,
        'IGST-12': 12,
        'IGST-18': 18,
        'IGST-28': 28,
      };

      const gstData = {
        version: 'GST3.0.4',
        hash: 'hash',
        fp: DateTime.local().toFormat('MMyyyy'),
        gstin: this.printSettings.gstin,
        b2b: [],
      };

      let rows = this.reportData.rows;
      rows.forEach(async (values) => {

        const b2bRecord = {
          ctin: values.gstin,
          inv: [],
        };

        const invRecord = {
          inum: values.invNo,
          idt: values.invDate,
          value: values.invAmt,
          pos: values.gstin.substring(0, 2),
          rchrg: values.reverseCharge,
          itms: [],
        };

        let items = await frappe.db
          .knex('SalesInvoiceItem')
          .where('parent', invRecord.inum);

        items.forEach((_item) => {
          const item = {
            num: 1801, // will be replaced by HSN CODE
            itm_det: {
              txval: _item.baseAmount,
              rt: gstRates[_item.tax],
              cess: 0,
              camt: (csgstRates[_item.tax] * _item.baseAmount) / 100,
              samt: (csgstRates[_item.tax] * _item.baseAmount) / 100,
              iamt: (igstRates[_item.tax] * _item.baseAmount) / 100,
            },
          };
          invRecord.itms.push(item);
        });

        let found = false;
        found = gstData.b2b.find((_b2bRecord) => {
          if(_b2bRecord.ctin === values.gstin) {
            _b2bRecord.inv.push(invRecord);
            return true;
          }
        });

        if (!found) {
          b2bRecord.inv.push(invRecord);
          gstData.b2b.push(b2bRecord);
        }
      });
      await sleep(1);
      const jsonData = JSON.stringify(gstData);
      makeJSON(jsonData, savePath);
    },
    async getSavePath() {
      const options = {
        title: this._('Select folder'),
        defaultPath: `${this.reportName}.json`,
      };

      let { filePath } = await ipcRenderer.invoke(
        IPC_ACTIONS.GET_SAVE_FILEPATH,
        options
      );

      if (filePath) {
        if (!filePath.endsWith('.json')) {
          filePath = filePath + '.json';
        }
      }

      return filePath;
    },
  },
  computed: {
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
    isGstReportsPage() {
      return this.report.title.includes('GSTR');
    },
  },
};
</script>

<style>
.report-scroll-container {
  height: calc(100vh - 12rem);
}
.report-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.report-scroll-container::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.200');
}
.report-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.300');
}
.report-scroll-container::-webkit-scrollbar-track {
  background-color: white;
}
</style>