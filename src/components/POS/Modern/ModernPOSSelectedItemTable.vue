<template>
  <Row
    :ratio="ratio"
    class="
      w-full
      px-2
      mt-2
      border
      rounded-t
      text-gray-600
      dark:border-gray-800 dark:text-gray-400
    "
  >
    <div
      v-if="tableFields"
      v-for="df in tableFields"
      :key="df.fieldname"
      class="text-lg flex m-2"
      :class="{
      'ms-auto': isNumeric(df as Field),
    }"
    >
      {{ df.label }}
    </div>
  </Row>

  <div
    class="overflow-auto custom-scroll custom-scroll-thumb1"
    style="height: calc(90vh - 25rem)"
  >
    <Row
      v-for="row in sinvDoc.items"
      :ratio="ratio"
      class="
        p-2
        border
        w-full
        hover:bg-gray-25
        dark:border-gray-800 dark:bg-gray-890
      "
    >
      <ModernPOSSelectedItemRow
        :row="(row as SalesInvoiceItem)"
        @selected-row="selectedItemRow"
        @run-sinv-formulas="runSinvFormulas"
        @apply-pricing-rule="$emit('applyPricingRule')"
        @toggle-modal="$emit('toggleModal')"
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
import ModernPOSSelectedItemRow from './ModernPOSSelectedItemRow.vue';
import { isNumeric } from 'src/utils';
import { t } from 'fyo';
import { inject, defineComponent } from 'vue';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { Field } from 'schemas/types';

export default defineComponent({
  name: 'ModernPOSSelectedItemTable',
  components: {
    FormContainer,
    FormControl,
    Link,
    Row,
    RowEditForm,
    ModernPOSSelectedItemRow,
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
  emits: ['toggleModal', 'selectedRow', 'applyPricingRule'],
  computed: {
    ratio() {
      return [0.1, 0.8, 0.4, 0.8, 0.8, 0.3];
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
          label: t`Item`,
          placeholder: 'Item',
          required: true,
          schemaName: 'Item',
        },
        {
          fieldname: 'quantity',
          label: t`Quantity`,
          placeholder: 'Quantity',
          fieldtype: 'Int',
          required: true,
          schemaName: '',
        },
        {
          fieldname: 'rate',
          label: t`Rate`,
          placeholder: 'Rate',
          fieldtype: 'Currency',
          required: true,
          schemaName: '',
        },
        {
          fieldname: 'amount',
          label: t`Amount`,
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
    selectedItemRow(row: SalesInvoiceItem, field: string) {
      this.$emit('selectedRow', row, field);
    },
    isNumeric,
  },
});
</script>
