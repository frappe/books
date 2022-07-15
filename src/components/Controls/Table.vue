<template>
  <div v-if="tableFields?.length">
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>

    <!-- Title Row -->
    <Row
      :ratio="ratio"
      class="border-b px-2 text-gray-600 w-full flex items-center"
    >
      <div class="flex items-center pl-2">#</div>
      <div
        class="items-center flex px-2 h-row-mid"
        :class="{
          'ml-auto': isNumeric(df),
        }"
        v-for="df in tableFields"
        :key="df.fieldname"
        :style="{
          height: ``,
        }"
      >
        {{ df.label }}
      </div>
    </Row>

    <!-- Data Rows -->
    <div
      class="overflow-auto"
      :style="{ 'max-height': maxHeight }"
      v-if="value"
    >
      <TableRow
        v-for="row in value"
        ref="table-row"
        :key="row.name"
        v-bind="{ row, tableFields, size, ratio, isNumeric }"
        :read-only="isReadOnly"
        @remove="removeRow(row)"
        :can-edit-row="canEditRow"
      />
    </div>

    <!-- Add Row and Row Count -->
    <Row
      :ratio="ratio"
      class="
        text-gray-500
        cursor-pointer
        border-transparent
        px-2
        w-full
        h-row-mid
        flex
        items-center
      "
      v-if="!isReadOnly"
      @click="addRow"
    >
      <div class="flex items-center pl-1">
        <feather-icon name="plus" class="w-4 h-4 text-gray-500" />
      </div>
      <div class="flex justify-between px-2">
        {{ t`Add Row` }}
      </div>
      <div v-for="i in ratio.slice(3).length" :key="i"></div>
      <div
        class="text-right px-2"
        v-if="
          value && maxRowsBeforeOverflow && value.length > maxRowsBeforeOverflow
        "
      >
        {{ t`${value.length} rows` }}
      </div>
    </Row>
  </div>
</template>

<script>
import Row from 'src/components/Row.vue';
import { fyo } from 'src/initFyo';
import { nextTick } from 'vue';
import Base from './Base.vue';
import TableRow from './TableRow.vue';

export default {
  name: 'Table',
  emits: ['editrow'],
  extends: Base,
  props: {
    value: { type: Array, default: () => [] },
    showHeader: {
      type: Boolean,
      default: true,
    },
    maxRowsBeforeOverflow: {
      type: Number,
      default: 3,
    },
  },
  components: {
    Row,
    TableRow,
  },
  inject: {
    doc: { default: null },
  },
  watch: {
    value() {
      this.setMaxHeight();
    },
  },
  data() {
    return { maxHeight: '' };
  },
  mounted() {
    if (fyo.store.isDevelopment) {
      window.tab = this;
    }
  },
  methods: {
    focus() {},
    addRow() {
      this.doc.append(this.df.fieldname, {}).then((s) => {
        if (!s) {
          return;
        }

        nextTick(() => {
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
    setMaxHeight() {
      if (this.maxRowsBeforeOverflow === 0) {
        return (this.maxHeight = '');
      }

      const size = this?.value?.length ?? 0;
      if (size === 0) {
        return (this.maxHeight = '');
      }

      const rowHeight = this.$refs?.['table-row']?.[0]?.$el.offsetHeight;
      if (rowHeight === undefined) {
        return (this.maxHeight = '');
      }

      const maxHeight = rowHeight * Math.min(this.maxRowsBeforeOverflow, size);
      return (this.maxHeight = `${maxHeight}px`);
    },
  },
  computed: {
    height() {
      if (this.size === 'small') {
      }
      return 2;
    },
    canEditRow() {
      return this.df.edit;
    },
    ratio() {
      const ratio = [0.3].concat(this.tableFields.map(() => 1));

      if (this.canEditRow) {
        return ratio.concat(0.3);
      }

      return ratio;
    },
    tableFields() {
      const fields = fyo.schemaMap[this.df.target].tableFields ?? [];
      return fields.map((fieldname) => fyo.getField(this.df.target, fieldname));
    },
  },
};
</script>
