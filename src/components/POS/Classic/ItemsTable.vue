<template>
  <Row
    :ratio="ratio"
    class="
      border
      dark:border-gray-800
      flex
      items-center
      mt-4
      px-2
      rounded-t-md
      text-gray-600
      dark:text-gray-400
      w-full
    "
  >
    <div
      v-for="df in tableFields"
      :key="df.fieldname"
      class="flex items-center px-2 py-2 text-lg"
      :class="{
        'ms-auto': isNumeric(df as Field),
      }"
      :style="{
        height: ``,
      }"
    >
      {{ df.label }}
    </div>
  </Row>

  <div
    class="overflow-y-auto custom-scroll custom-scroll-thumb2"
    style="height: 70vh"
  >
    <Row
      v-if="items"
      v-for="row in items as POSItem[]"
      :ratio="ratio"
      :border="true"
      class="
        border-b border-l border-r
        dark:border-gray-800
        flex
        group
        h-row-mid
        hover:bg-gray-25
        dark:bg-gray-890
        items-center
        justify-center
        px-2
        w-full
      "
      @click="handleChange(row)"
    >
      <FormControl
        v-for="df in tableFields"
        :key="df.fieldname"
        size="large"
        class=""
        :df="df"
        :value="(row as POSItem)[df.fieldname as keyof POSItem]"
        :readOnly="true"
      />
    </Row>
  </div>
</template>

<script lang="ts">
import FormControl from 'src/components/Controls/FormControl.vue';
import Row from 'src/components/Row.vue';
import { isNumeric } from 'src/utils';
import { defineComponent } from 'vue';
import { Field } from 'schemas/types';
import { POSItem } from '../types';

export default defineComponent({
  name: 'ItemsTable',
  components: { FormControl, Row },
  emits: ['addItem', 'updateValues'],
  props: {
    items: Array,
    itemQtyMap: Object,
    itemVisibility: {
      type: String,
      default: 'Inventory Items',
    },
  },
  computed: {
    ratio() {
      if (this.itemVisibility === 'ERP Sync Items') {
        return [1, 1.5, 0.8];
      }
      return [1, 1, 1, 0.7];
    },
    tableFields() {
      const fields = [
        {
          fieldname: 'name',
          fieldtype: 'Data',
          label: 'Item',
          placeholder: 'Item',
          readOnly: true,
        },
        {
          fieldname: 'rate',
          label: 'Rate',
          placeholder: 'Rate',
          fieldtype: 'Currency',
          readOnly: true,
        },
        {
          fieldname: 'unit',
          label: 'Unit',
          placeholder: 'Unit',
          fieldtype: 'Data',
          target: 'UOM',
          readOnly: true,
        },
      ] as Field[];

      if (this.itemVisibility !== 'ERP Sync Items') {
        fields.splice(2, 0, {
          fieldname: 'availableQty',
          label: 'Qty',
          placeholder: 'Available Qty',
          fieldtype: 'Float',
          readOnly: true,
        });
      }

      return fields;
    },
  },
  methods: {
    handleChange(value: POSItem) {
      this.$emit('addItem', value);
      this.$emit('updateValues');
    },
    isNumeric,
  },
});
</script>
