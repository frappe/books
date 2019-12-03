<template>
  <div>
    <div class="text-gray-600 text-sm mb-1" v-if="showLabel">
      {{ df.label }}
    </div>
    <Row :ratio="ratio" class="border-b px-2 text-gray-600 w-full">
      <div class="flex items-center pl-2">No</div>
      <div
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small',
          'text-right': isNumeric(df)
        }"
        v-for="df in tableFields"
        :key="df.fieldname"
      >
        {{ df.label }}
      </div>
    </Row>
    <TableRow v-for="row in value" :key="row.name" v-bind="{ row, tableFields, size, ratio, isNumeric }" />
    <Row
      :ratio="ratio"
      class="text-gray-500 cursor-pointer border-transparent px-2 w-full"
      v-if="!isReadOnly"
    >
      <div class="flex items-center pl-1">
        <feather-icon
          name="plus"
          class="w-4 h-4 text-gray-500"
        />
      </div>
      <div
        :class="{
          'px-2 py-3': size === 'small',
          'px-3 py-4': size !== 'small'
        }"
        @click="addRow"
      >
        {{ _('Add Row') }}
      </div>
    </Row>
  </div>
</template>

<script>
import Row from '@/components/Row';
import Icon from '@/components/Icon';
import Base from './Base';
import TableRow from './TableRow';

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
    Icon,
    TableRow
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
