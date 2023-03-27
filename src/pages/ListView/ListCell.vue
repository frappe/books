<template>
  <div class="flex items-center truncate" :class="cellClass">
    <span class="truncate" v-if="!customRenderer">{{ columnValue }}</span>
    <component v-else :is="customRenderer" />
  </div>
</template>
<script lang="ts">
import { ColumnConfig, RenderData } from 'fyo/model/types';
import { Field } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { isNumeric } from 'src/utils';
import { defineComponent, PropType } from 'vue';

type Column = ColumnConfig | Field;

function isField(column: ColumnConfig | Field): column is Field {
  if ((column as ColumnConfig).display || (column as ColumnConfig).render) {
    return false;
  }

  return true;
}

export default defineComponent({
  name: 'ListCell',
  props: {
    row: { type: Object as PropType<RenderData>, required: true },
    column: { type: Object as PropType<Column>, required: true },
  },
  computed: {
    columnValue(): string {
      const column = this.column;
      const value = this.row[this.column.fieldname];

      if (isField(column)) {
        return fyo.format(value, column);
      }

      return column.display?.(value, fyo) ?? '';
    },
    customRenderer() {
      const { render } = this.column as ColumnConfig;

      if (!render) {
        return;
      }

      return render(this.row);
    },
    cellClass() {
      return isNumeric(this.column.fieldtype) ? 'justify-end' : '';
    },
  },
});
</script>
