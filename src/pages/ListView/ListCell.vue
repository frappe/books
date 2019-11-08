<template>
  <div
    class="py-4 flex items-center"
    :class="['Float', 'Currency'].includes(column.fieldtype) ? 'justify-end':''"
  >
    <span v-if="!customRenderer">{{ columnValue }}</span>
    <component v-else :is="customRenderer" />
  </div>
</template>
<script>
import frappe from 'frappejs';

export default {
  name: 'ListCell',
  props: ['doc', 'column'],
  computed: {
    columnValue() {
      let { column, doc } = this;
      return frappe.format(column.getValue(doc), column.fieldtype);
    },
    customRenderer() {
      if (!this.column.render) return;
      return this.column.render(this.doc);
    }
  }
};
</script>
