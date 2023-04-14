<template>
  <div v-if="tableFields?.length">
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>

    <div :class="border ? 'border rounded-md' : ''">
      <!-- Title Row -->
      <Row
        :ratio="ratio"
        class="border-b px-2 text-gray-600 w-full flex items-center"
      >
        <div class="flex items-center ps-2">#</div>
        <div
          class="items-center flex px-2 h-row-mid"
          :class="{
            'ms-auto': isNumeric(df),
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
        class="overflow-auto custom-scroll"
        :style="{ 'max-height': maxHeight }"
        v-if="value"
      >
        <TableRow
          v-for="(row, idx) of value"
          :class="idx < value.length - 1 ? 'border-b' : ''"
          ref="table-row"
          :key="row.name"
          v-bind="{ row, tableFields, size, ratio, isNumeric }"
          :read-only="isReadOnly"
          :can-edit-row="canEditRow"
          @remove="removeRow(row)"
          @change="(field, value) => $emit('row-change', field, value, this.df)"
        />
      </div>

      <!-- Add Row and Row Count -->
      <Row
        :ratio="ratio"
        class="
          text-gray-500
          cursor-pointer
          px-2
          w-full
          h-row-mid
          flex
          items-center
        "
        :class="value.length > 0 ? 'border-t' : ''"
        v-if="!isReadOnly"
        @click="addRow"
      >
        <div class="flex items-center ps-1">
          <feather-icon name="plus" class="w-4 h-4 text-gray-500" />
        </div>
        <div
          class="flex justify-between px-2"
          :style="`grid-column: 2 / ${ratio.length + 1}`"
        >
          <p>
            {{ t`Add Row` }}
          </p>
          <p
            class="text-end px-2"
            v-if="
              value &&
              maxRowsBeforeOverflow &&
              value.length > maxRowsBeforeOverflow
            "
          >
            {{ t`${value.length} rows` }}
          </p>
        </div>
      </Row>
    </div>
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
  emits: ['editrow', 'row-change'],
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
    border: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    Row,
    TableRow,
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
