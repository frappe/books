<template>
  <div>
    <Row :ratio="ratio" class="border-b px-2 text-gray-600">
      <div class="flex items-center pl-2">No</div>
      <div
        :class="{'px-2 py-3': size === 'small', 'px-3 py-4': size !== 'small', 'text-right': isNumeric(df) }"
        v-for="df in tableFields"
        :key="df.fieldname"
      >{{ df.label }}</div>
    </Row>
    <Row v-for="row in value" :key="row.name" :ratio="ratio" class="border-b px-2">
      <div class="flex items-center pl-2 text-gray-600">{{ row.idx + 1 }}</div>
      <FormControl
        :size="size"
        class="py-2"
        :input-class="{'text-right': isNumeric(df)}"
        :key="df.fieldname"
        v-for="df in tableFields"
        :df="df"
        :value="row[df.fieldname]"
        @change="value => row.set(df.fieldname, value)"
        @new-doc="doc => row.set(df.fieldname, doc.name)"
      />
    </Row>
    <Row :ratio="ratio" class="text-gray-500 cursor-pointer border-transparent px-2">
      <div class="flex items-center pl-2">
        <AddIcon class="w-3 h-3 text-gray-500 stroke-current" />
      </div>
      <div
        :class="{'px-2 py-3': size === 'small', 'px-3 py-4': size !== 'small'}"
        @click="addRow"
      >{{ _('Add Row') }}</div>
    </Row>
  </div>
</template>

<script>
import Row from '@/components/Row';
import AddIcon from '@/components/Icons/Add';
import Base from './Base';
import FormControl from './FormControl';

export default {
  name: 'Table',
  extends: Base,
  props: {
    showHeader: {
      default: true
    }
  },
  components: {
    Row,
    AddIcon
  },
  beforeCreate() {
    this.$options.components.FormControl = FormControl;
  },
  methods: {
    focus() {},
    addRow() {
      let rows = this.value || [];
      this.triggerChange([...rows, {}]);
    }
  },
  computed: {
    ratio() {
      return [0.3].concat(this.tableFields.map(_ => 1));
    },
    tableFields() {
      let meta = frappe.getMeta(this.df.childtype);
      return meta.tableFields.map(fieldname => meta.getField(fieldname));
    }
  }
};
</script>
