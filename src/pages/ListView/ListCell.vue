<template>
  <div class="flex items-center truncate" :class="cellClass">
    <span class="truncate" v-if="!customRenderer">{{ columnValue }}</span>
    <component v-else :is="customRenderer" />
  </div>
</template>
<script>
import { fyo } from 'src/initFyo';
import { isNumeric } from 'src/utils';

export default {
  name: 'ListCell',
  props: ['doc', 'column'],
  computed: {
    columnValue() {
      let { column, doc } = this;
      let value = doc[column.fieldname];
      return fyo.format(value, column, doc);
    },
    customRenderer() {
      if (!this.column.render) return;
      return this.column.render(this.doc);
    },
    cellClass() {
      return isNumeric(this.column.fieldtype) ? 'justify-end' : '';
    },
  },
};
</script>
