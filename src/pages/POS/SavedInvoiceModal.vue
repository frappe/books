<template>
  <Modal class="h-auto w-auto px-10" :set-close-listener="false">
    <p class="text-center py-4">Saved Invoices</p>

    <hr class="dark:border-gray-800" />

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
        :style="{
          height: ``,
        }"
      >
        {{ df.label }}
      </div>
    </Row>

    <div class="overflow-y-auto" style="height: 65vh; width: 60vh">
      <Row
        v-if="savedInvoices.length"
        v-for="row in savedInvoices as any"
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
            @click="$emit('selectedInvoiceName', row)"
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

    <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto p-10">
      <div class="col-span-2">
        <Button
          class="w-full bg-red-500"
          style="padding: 1.35rem"
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
import Data from 'src/components/Controls/Data.vue';
import Modal from 'src/components/Modal.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import { t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { Field } from 'schemas/types';
import Row from 'src/components/Row.vue';
import FormControl from 'src/components/Controls/FormControl.vue';

export default defineComponent({
  name: 'SavedInvoiceModal',
  components: {
    Modal,
    Button,
    Data,
    FormControl,
    Row,
  },
  data() {
    return {
      savedInvoices: [] as SalesInvoice[],
      isModalVisible: false,
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
  },
  props: {
    modalStatus: Boolean,
  },
  emits: ['toggleModal' , 'selectedInvoiceName'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  async mounted() {
    await this.setSavedInvoices();
  },
  async activated() {
    await this.setSavedInvoices();
  },
  watch: {
    modalStatus(newVal) {
      if (newVal) {
        this.setSavedInvoices();
      }
    },
  },

  methods: {
    async setSavedInvoices() {
      this.savedInvoices = (await this.fyo.db.getAll(
        ModelNameEnum.SalesInvoice,
        {
          fields: [],
          filters: { isPOS: true, submitted: false },
        }
      )) as SalesInvoice[];
    },
    async selectedInvoice(row: SalesInvoice) {
      let selectedInvoideDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        row.name
      )) as SalesInvoice;

      this.sinvDoc = selectedInvoideDoc;
      this.$emit('toggleModal', 'SavedInvoice');
    },
  },
});
</script>
