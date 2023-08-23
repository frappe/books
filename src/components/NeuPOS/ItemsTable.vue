<template>
  <Row
    :ratio="ratio"
    class="border flex items-center mt-4 px-2 rounded-t-md text-gray-600 w-full"
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

  <Row
    v-if="items"
    v-for="row in items"
    :ratio="ratio"
    :border="true"
    class="
      border-b border-l border-r
      flex
      group
      h-row-mid
      hover:bg-gray-25
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
      :value="row[df.fieldname]"
      :readOnly="true"
    />
  </Row>
</template>

<script lang="ts">
import FormControl from '../Controls/FormControl.vue';
import Row from 'src/components/Row.vue';
import { isNumeric } from 'src/utils';
import { inject } from 'vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import { ModelNameEnum } from 'models/types';
import { Field } from 'schemas/types';
import { DocValueMap } from 'fyo/core/types';
import { ItemQtyMap } from './types';

export default defineComponent({
  name: 'ItemsTable',
  components: { FormControl, Row },
  emits: ['addItem', 'updateValues'],
  data() {
    return {
      items: [] as DocValueMap[],
      itemQtyMap: inject('itemQtyMap') as ItemQtyMap,
    };
  },
  computed: {
    ratio() {
      return [1, 1, 1, 0.7];
    },
    tableFields() {
      return [
        {
          fieldname: 'item',
          fieldtype: 'Link',
          label: 'Item',
          placeholder: 'Item',
          required: true,
          schemaName: 'Item',
        },
        {
          fieldname: 'rate',
          label: 'Rate',
          placeholder: 'Rate',
          fieldtype: 'Currency',
          required: true,
        },
        {
          fieldname: 'availableQty',
          label: 'Available Qty',
          placeholder: 'Available Qty',
          fieldtype: 'Float',
          required: true,
        },
        {
          fieldname: 'unit',
          label: 'Unit',
          placeholder: 'Unit',
          fieldtype: 'Link',
          required: true,
          schemaName: 'UOM',
        },
      ];
    },
  },
  async activated() {
    await this.getItems();
  },
  methods: {
    async getItems() {
      this.items = [];
      const query = await fyo.db.getAll(ModelNameEnum.Item, { fields: [] });
      for (const row of query) {
        let availableQty = 0;

        if (this.itemQtyMap[row.name as string]) {
          availableQty = this.itemQtyMap[row.name as string].availableQty;
        }

        this.items.push({
          item: row.name,
          availableQty,
          ...row,
        });
      }
    },
    handleChange(value: DocValueMap) {
      this.$emit('addItem', value);
      this.$emit('updateValues');
    },
    isNumeric,
  },
});
</script>
