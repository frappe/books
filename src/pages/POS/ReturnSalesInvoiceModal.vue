<template>
  <Modal class="h-auto w-auto p-5" :set-close-listener="false">
    <p class="text-center font-semibold dark:text-gray-400">
      {{ t`Invoices` }}
    </p>

    <hr class="mt-2 dark:border-gray-800" />

    <div class="mt-4">
      <input
        v-model="invoiceSearchTerm"
        type="text"
        placeholder="Search by Invoice Name"
        class="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
      />
    </div>

    <hr class="mt-2 dark:border-gray-800" />

    <Row
      :ratio="ratio"
      class="
        border
        flex
        items-center
        mt-2
        px-2
        w-full
        rounded-t-md
        text-gray-600
        dark:border-gray-800 dark:text-gray-400
      "
    >
      <div
        v-for="df in tableFields"
        :key="df.fieldname"
        class="flex items-center px-2 py-2 text-lg"
      >
        {{ df.label }}
      </div>
    </Row>

    <div
      class="overflow-y-auto custom-scroll custom-scroll-thumb2"
      style="height: 65vh; width: 60vh"
    >
      <Row
        v-for="row in filteredInvoices"
        :key="row.name"
        :ratio="ratio"
        :border="true"
        class="
          border-b border-l border-r
          dark:border-gray-800 dark:bg-gray-890
          flex
          group
          h-row-mid
          hover:bg-gray-25
          items-center
          justify-center
          px-2
          w-full
        "
        @click="returnInvoice(row as SalesInvoice)"
      >
        <FormControl
          v-for="df in tableFields"
          :key="df.fieldname"
          size="large"
          :df="df"
          :value="row[df.fieldname]"
          :read-only="true"
        />
      </Row>
    </div>

    <div class="row-start-6 grid grid-cols-2 gap-4 mt-4">
      <div class="col-span-2">
        <Button
          class="w-full p-5 bg-red-500 dark:bg-red-700"
          @click="$emit('toggleModal', 'SavedInvoice')"
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Cancel` }}
            </p>
          </slot>
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import Row from 'src/components/Row.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import { ModelNameEnum } from 'models/types';
import { Field } from 'schemas/types';

export default defineComponent({
  name: 'ReturnSalesInvoice',
  components: {
    Modal,
    Button,
    FormControl,
    Row,
  },
  props: {
    modalStatus: Boolean,
  },
  emits: ['toggleModal', 'selectedReturnInvoice'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      returnedInvoices: [] as SalesInvoice[],
      invoiceSearchTerm: '',
    };
  },
  computed: {
    ratio() {
      return [1, 1, 1, 0.8];
    },
    tableFields() {
      return [
        {
          fieldname: 'name',
          label: 'Name',
          fieldtype: 'Link',
          target: 'SalesInvoice',
          readOnly: true,
        },
        {
          fieldname: 'party',
          fieldtype: 'Link',
          label: 'Customer',
          target: 'Party',
          placeholder: 'Customer',
          readOnly: true,
        },
        {
          fieldname: 'date',
          label: 'Date',
          fieldtype: 'Date',
          readOnly: true,
        },
        {
          fieldname: 'grandTotal',
          label: 'Grand Total',
          fieldtype: 'Currency',
          readOnly: true,
        },
      ] as Field[];
    },
    filteredInvoices() {
      return this.returnedInvoices.filter((invoice) =>
        invoice.name
          .toLowerCase()
          .includes(this.invoiceSearchTerm.toLowerCase())
      );
    },
  },
  watch: {
    async modalStatus(newVal) {
      if (newVal) {
        await this.setReturnedInvoices();
      }
    },
  },
  async mounted() {
    await this.setReturnedInvoices();
  },
  async activated() {
    await this.setReturnedInvoices();
  },

  methods: {
    returnInvoice(row: SalesInvoice) {
      this.$emit('selectedReturnInvoice', row.name);
      this.$emit('toggleModal', 'ReturnSalesInvoice');
    },
    async setReturnedInvoices() {
      const allInvoices = await this.fyo.db.getAll(ModelNameEnum.SalesInvoice, {
        fields: [],
        filters: {
          isPOS: true,
          submitted: true,
          cancelled: false,
        },
      });

      const returnedInvoiceNames = allInvoices
        .filter((inv) => inv.returnAgainst)
        .map((inv) => inv.returnAgainst);

      const filteredInvoices = allInvoices.filter(
        (inv) => !inv.returnAgainst && !returnedInvoiceNames.includes(inv.name)
      );
      this.returnedInvoices = filteredInvoices as SalesInvoice[];
    },
  },
});
</script>
