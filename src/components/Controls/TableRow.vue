<template>
  <Row :ratio="ratio" class="w-full px-2 border-b hover:bg-brand-100 group">
    <div class="flex items-center pl-2 text-gray-600">
      <span class="hidden group-hover:inline-block">
        <feather-icon
          name="x"
          class="w-4 h-4 -ml-1 cursor-pointer"
          @click="$emit('remove')"
        />
      </span>
      <span class="group-hover:hidden">
        {{ row.idx + 1 }}
      </span>
    </div>
    <FormControl
      :size="size"
      class="py-2"
      :input-class="{ 'text-right': isNumeric(df), 'bg-transparent': true }"
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
  data: () => ({ hovering: false }),
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
