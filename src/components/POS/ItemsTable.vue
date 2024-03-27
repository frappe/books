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

  <div class="overflow-y-auto" style="height: 72.5vh">
    <Row
      v-if="items"
      v-for="row in items"
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
      @click="handleChange(row as POSItem)"
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
  </div>
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
import { ItemQtyMap } from './types';
import { Item } from 'models/baseModels/Item/Item';
import { POSItem } from './types';
import { Money } from 'pesa';

export default defineComponent({
  name: 'ItemsTable',
  components: { FormControl, Row },
  emits: ['addItem', 'updateValues'],
  setup() {
    return {
      itemQtyMap: inject('itemQtyMap') as ItemQtyMap,
    };
  },
  data() {
    return {
      items: [] as POSItem[],
    };
  },
  computed: {
    ratio() {
      return [1, 1, 1, 0.7];
    },
    tableFields() {
      return [
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
          fieldname: 'availableQty',
          label: 'Available Qty',
          placeholder: 'Available Qty',
          fieldtype: 'Float',
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
    },
  },
  watch: {
    itemQtyMap: {
      async handler() {
        this.setItems();
      },
      deep: true,
    },
  },
  async activated() {
    await this.setItems();
  },
  methods: {
    async setItems() {
      const items = (await fyo.db.getAll(ModelNameEnum.Item, {
        fields: [],
        filters: { trackItem: true },
      })) as Item[];

      this.items = [] as POSItem[];
      for (const item of items) {
        let availableQty = 0;

        if (!!this.itemQtyMap[item.name as string]) {
          availableQty = this.itemQtyMap[item.name as string].availableQty;
        }

        if (!item.name) {
          return;
        }

        this.items.push({
          availableQty,
          name: item.name,
          rate: item.rate as Money,
          unit: item.unit as string,
          hasBatch: !!item.hasBatch,
          hasSerialNumber: !!item.hasSerialNumber,
        });
      }
    },
    handleChange(value: POSItem) {
      this.$emit('addItem', value);
      this.$emit('updateValues');
    },
    isNumeric,
  },
});
</script>
