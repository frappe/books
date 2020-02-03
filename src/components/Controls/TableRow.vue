<template>
  <Row
    :ratio="ratio"
    class="border-b px-2 w-full "
    :class="{ 'bg-brand-100': hovering }"
    @mouseover="hovering = true"
    @mouseleave="hovering = false"
    @click="hovering = false"
  >
    <div class="flex items-center pl-2 text-gray-600">
      <span v-if="hovering">
        <feather-icon
          name="x"
          class="w-4 h-4 -ml-1 cursor-pointer"
          @click="$emit('remove')"
        />
      </span>
      <span v-else>
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
