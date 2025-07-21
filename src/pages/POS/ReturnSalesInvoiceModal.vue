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
        class="
          w-full
          p-2
          border
          rounded-md
          dark:bg-gray-800 dark:text-white
          focus:outline-none focus:ring-0
        "
        @keydown.enter="handleSearchEnter"
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
        v-for="row in paginatedInvoices"
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

    <div class="mt-1 mb-1">
      <Paginator
        :item-count="filteredInvoices.length"
        :allowed-counts="[20, 40, -1]"
        @index-change="setPageIndices"
      />
    </div>

    <div class="row-start-6 grid grid-cols-2 gap-4 mt-1">
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
import { Money } from 'pesa';
import Paginator from 'src/components/Paginator.vue';

export default defineComponent({
  name: 'ReturnSalesInvoice',
  components: {
    Modal,
    Button,
    FormControl,
    Row,
    Paginator,
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
      pageStart: 0,
      pageEnd: 20,
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
        (invoice.name as string)
          .toLowerCase()
          .includes(this.invoiceSearchTerm.toLowerCase())
      );
    },
    paginatedInvoices() {
      return this.filteredInvoices.slice(this.pageStart, this.pageEnd);
    },
  },
  watch: {
    async modalStatus(newVal) {
      if (newVal) {
        await this.setReturnedInvoices();
      }
    },
    invoiceSearchTerm() {
      this.pageStart = 0;
      this.pageEnd = this.pageEnd - this.pageStart || 20;
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
    handleSearchEnter() {
      if (this.filteredInvoices.length === 1) {
        this.returnInvoice(this.filteredInvoices[0] as SalesInvoice);
      }
    },
    setPageIndices({ start, end }: { start: number; end: number }) {
      this.pageStart = start;
      this.pageEnd = end;
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
        .filter((inv) => {
          if (inv.isFullyReturned || inv.returnAgainst) {
            return false;
          }

          if (inv.isReturned && !inv.isFullyReturned) {
            return true;
          }

          if (!inv.isReturned && !inv.returnAgainst) {
            return true;
          }

          if (!inv.isReturned && !(inv.outstandingAmount as Money).isZero()) {
            return true;
          }

          return false;
        })
        .map((inv) => inv.name);
      this.returnedInvoices = allInvoices.filter((inv) =>
        returnedInvoiceNames.includes(inv.name)
      ) as SalesInvoice[];
    },
  },
});
</script>
