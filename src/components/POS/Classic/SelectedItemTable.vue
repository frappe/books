<template>
  <Row
    :ratio="ratio"
    class="
      border
      dark:border-gray-800
      rounded-t
      px-2
      text-gray-600
      dark:text-gray-400
      w-full
      flex
      items-center
      mt-2
    "
  >
    <div
      v-if="tableFields"
      v-for="df in tableFields"
      :key="df.fieldname"
      class="items-center text-lg flex px-2 py-2"
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
    class="overflow-y-auto overflow-x-auto custom-scroll custom-scroll-thumb1"
    style="height: 50vh"
  >
    <Row
      v-for="row in sinvDoc.items"
      :ratio="ratio"
      class="
        border
        dark:border-gray-800
        w-full
        px-2
        py-2
        group
        flex
        items-center
        justify-center
        hover:bg-gray-25
        dark:bg-gray-890
      "
    >
      <SelectedItemRow
        :row="(row as SalesInvoiceItem)"
        @run-sinv-formulas="runSinvFormulas"
        @apply-pricing-rule="$emit('applyPricingRule')"
        @selected-row="selectedItemRow"
      />
    </Row>
  </div>
</template>

<script lang="ts">
import FormContainer from 'src/components/FormContainer.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Link from 'src/components/Controls/Link.vue';
import Row from 'src/components/Row.vue';
import RowEditForm from 'src/pages/CommonForm/RowEditForm.vue';
import SelectedItemRow from './SelectedItemRow.vue';
import { isNumeric } from 'src/utils';
import { inject } from 'vue';
import { defineComponent } from 'vue';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { Field } from 'schemas/types';

export default defineComponent({
  name: 'SelectedItemTable',
  components: {
    FormContainer,
    FormControl,
    Link,
    Row,
    RowEditForm,
    SelectedItemRow,
  },
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      isExapanded: false,
    };
  },
  emits: ['applyPricingRule', 'selectedRow'],
  computed: {
    ratio() {
      return [0.1, 0.9, 0.8, 0.8, 0.8, 0.8, 0.2];
    },
    tableFields() {
      return [
        {
          fieldname: 'toggler',
          fieldtype: 'Link',
          label: ' ',
        },
        {
          fieldname: 'item',
          fieldtype: 'Link',
          label: 'Item',
          placeholder: 'Item',
          required: true,
          schemaName: 'Item',
        },
        {
          fieldname: 'quantity',
          label: 'Quantity',
          placeholder: 'Quantity',
          fieldtype: 'Int',
          required: true,
          schemaName: '',
        },
        {
          fieldname: 'unit',
          label: 'Stock Unit',
          placeholder: 'Unit',
          fieldtype: 'Link',
          required: true,
          schemaName: 'UOM',
        },
        {
          fieldname: 'rate',
          label: 'Rate',
          placeholder: 'Rate',
          fieldtype: 'Currency',
          required: true,
          schemaName: '',
        },
        {
          fieldname: 'amount',
          label: 'Amount',
          placeholder: 'Amount',
          fieldtype: 'Currency',
          required: true,
          schemaName: '',
        },
        {
          fieldname: 'removeItem',
          fieldtype: 'Link',
          label: ' ',
        },
      ];
    },
  },
  methods: {
    async runSinvFormulas() {
      await this.sinvDoc.runFormulas();
    },
    selectedItemRow(row: SalesInvoiceItem) {
      this.$emit('selectedRow', row);
    },
    isNumeric,
  },
});
</script>
