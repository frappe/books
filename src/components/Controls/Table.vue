<template>
  <div v-if="tableFields?.length">
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>

    <!-- Title Row -->
    <Row :ratio="ratio" class="border-b px-2 text-gray-600 w-full">
      <div class="flex items-center pl-2">#</div>
      <div
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small',
          'text-right': isNumeric(df),
        }"
        v-for="df in tableFields"
        :key="df.fieldname"
      >
        {{ df.label }}
      </div>
    </Row>

    <!-- Data Rows -->
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

    <!-- Add Row and Row Count -->
    <Row
      :ratio="ratio"
      class="text-gray-500 cursor-pointer border-transparent px-2 w-full"
      v-if="!isReadOnly"
      @click="addRow"
    >
      <div class="flex items-center pl-1">
        <feather-icon name="plus" class="w-4 h-4 text-gray-500" />
      </div>
      <div
        class="flex justify-between"
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small',
        }"
      >
        {{ t`Add Row` }}
      </div>
      <div v-for="i in ratio.slice(3).length" :key="i"></div>
      <div
        class="text-right"
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small',
        }"
        v-if="maxRowsBeforeOverflow && value.length > maxRowsBeforeOverflow"
      >
        {{ t`${value.length} rows` }}
      </div>
    </Row>
  </div>
</template>

<script>
import Row from 'src/components/Row.vue';
import { fyo } from 'src/initFyo';
import Base from './Base.vue';
import TableRow from './TableRow.vue';

export default {
  name: 'Table',
  extends: Base,
  props: {
    showHeader: {
      type: Boolean,
      default: true,
    },
    maxRowsBeforeOverflow: {
      type: Number,
      default: 0,
    },
  },
  components: {
    Row,
    TableRow,
  },
  inject: {
    doc: { default: null },
  },
  mounted() {
    window.tab = this;
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
      },
    },
  },
  methods: {
    focus() {},
    addRow() {
      this.doc.append(this.df.fieldname, {}).then((s) => {
        if (!s) {
          return;
        }

        this.$nextTick(() => {
          this.scrollToRow(this.value.length - 1);
        });
        this.triggerChange(this.value);
      });
    },
    removeRow(row) {
      this.doc.remove(this.df.fieldname, row.idx).then((s) => {
        if (!s) {
          return;
        }

        this.triggerChange(this.value);
      });
    },
    scrollToRow(index) {
      const row = this.$refs['table-row'][index];
      row && row.$el.scrollIntoView({ block: 'nearest' });
    },
  },
  computed: {
    ratio() {
      return [0.3].concat(this.tableFields.map(() => 1));
    },
    tableFields() {
      const fields = fyo.schemaMap[this.df.target].tableFields ?? [];
      return fields.map((fieldname) => fyo.getField(this.df.target, fieldname));
    },
  },
};
</script>
