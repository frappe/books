<template>
  <Row :ratio="ratio" class="border-b px-2 w-full">
    <div class="flex items-center pl-2 text-gray-600">{{ row.idx + 1 }}</div>
    <FormControl
      :size="size"
      class="py-2"
      :input-class="{ 'text-right': isNumeric(df) }"
      :key="df.fieldname"
      v-for="df in tableFields"
      :df="df"
      :value="row[df.fieldname]"
      @change="value => row.set(df.fieldname, value)"
      @new-doc="doc => row.set(df.fieldname, doc.name)"
    />
  </Row>
</template>
<script>
import FormControl from './FormControl';
import Row from '@/components/Row';

export default {
  name: 'TableRow',
  props: ['row', 'tableFields', 'size', 'ratio', 'isNumeric'],
  components: {
    Row
  },
  beforeCreate() {
    this.$options.components.FormControl = FormControl;
  },
  provide() {
    return {
      doctype: this.row.doctype,
      name: this.row.name,
      doc: this.row
    };
  }
};
</script>
