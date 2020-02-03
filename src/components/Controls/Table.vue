<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <Row :ratio="ratio" class="border-b px-2 text-gray-600 w-full">
      <div class="flex items-center pl-2">No</div>
      <div
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small',
          'text-right': isNumeric(df)
        }"
        v-for="df in tableFields"
        :key="df.fieldname"
      >
        {{ df.label }}
      </div>
    </Row>
    <div class="overflow-auto" :style="{ 'max-height': rowContainerHeight }">
      <TableRow
        :class="{ 'pointer-events-none': isReadOnly }"
        ref="table-row"
        v-for="row in value"
        :key="row.name"
        v-bind="{ row, tableFields, size, ratio, isNumeric }"
        @remove="removeRow(row)"
      />
    </div>
    <Row
      :ratio="ratio"
      class="text-gray-500 cursor-pointer border-transparent px-2 w-full"
      v-if="!isReadOnly"
      @click.native="addRow"
    >
      <div class="flex items-center pl-1">
        <feather-icon name="plus" class="w-4 h-4 text-gray-500" />
      </div>
      <div
        class="flex justify-between"
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small'
        }"
      >
        {{ _('Add Row') }}
      </div>
      <div v-for="i in ratio.slice(3).length" :key="i"></div>
      <div
        class="text-right"
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small'
        }"
        v-if="maxRowsBeforeOverflow && value.length > maxRowsBeforeOverflow"
      >
        {{ value.length }} rows
      </div>
    </Row>
  </div>
</template>

<script>
import frappe from 'frappejs';
import Row from '@/components/Row';
import Base from './Base';
import TableRow from './TableRow';

export default {
  name: 'Table',
  extends: Base,
  props: {
    showHeader: {
      default: true
    },
    maxRowsBeforeOverflow: {
      default: 0
    }
  },
  components: {
    Row,
    TableRow
  },
  data: () => ({ rowContainerHeight: null }),
  watch: {
    value: {
      immediate: true,
      handler(rows) {
        if (!this.maxRowsBeforeOverflow) return;
        if (this.rowContainerHeight) return;
        if (rows && rows.length > 0) {
          this.$nextTick(() => {
            let rowHeight = this.$refs['table-row'][0].$el.offsetHeight;
            let containerHeight = rowHeight * this.maxRowsBeforeOverflow;
            this.rowContainerHeight = `${containerHeight}px`;
          });
        }
      }
    }
  },
  methods: {
    focus() {},
    addRow() {
      let rows = this.value || [];
      this.triggerChange([...rows, {}]);
      this.$nextTick(() => {
        this.scrollToRow(this.value.length - 1);
      });
    },
    removeRow(row) {
      let rows = this.value || [];
      rows = rows.filter(_row => _row !== row);
      this.triggerChange(rows);
    },
    scrollToRow(index) {
      let row = this.$refs['table-row'][index];
      row && row.$el.scrollIntoView({ block: 'nearest' });
    }
  },
  computed: {
    ratio() {
      return [0.3].concat(this.tableFields.map(() => 1));
    },
    tableFields() {
      let meta = frappe.getMeta(this.df.childtype);
      return meta.tableFields.map(fieldname => meta.getField(fieldname));
    }
  }
};
</script>
