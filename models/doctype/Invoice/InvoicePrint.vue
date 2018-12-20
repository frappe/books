<template>
  <div class="row no-gutters">
    <component :themeColor="color" :is="invoiceTemplate" v-if="doc" :doc="doc"/>
  </div>
</template>
<script>
import InvoiceTemplate1 from '@/../models/doctype/Invoice/InvoiceTemplate1';
import InvoiceTemplate2 from '@/../models/doctype/Invoice/InvoiceTemplate2';
import InvoiceTemplate3 from '@/../models/doctype/Invoice/InvoiceTemplate3';

const invoiceTemplates = {
  'Basic I': InvoiceTemplate1,
  'Basic II': InvoiceTemplate2,
  'Modern': InvoiceTemplate3
};

export default {
  name: 'InvoicePrint',
  props: ['doc', 'themeColor', 'template'],
  data() {
    return {
      color: null,
      invoiceTemplate: null
    };
  },
  watch: {
    themeColor: async function() {
      await this.loadInvoice();
    },
    template: async function() {
      await this.loadInvoice();
    }
  },
  async created() {
    await this.loadInvoice();
  },
  methods: {
    async loadInvoice() {
      this.color = this.themeColor !== null ? this.themeColor : await this.getColor();
      let template = this.template !== null ? this.template : await this.getTemplate();
      let templateFile = invoiceTemplates[template];
      this.invoiceTemplate = templateFile;
    },
    async getTemplate() {
      let invoiceSettings = await frappe.getDoc('InvoiceSettings');
      return invoiceSettings.invoiceTemplate;
    },
    async getColor() {
      let invoiceSettings = await frappe.getDoc('InvoiceSettings');
      return invoiceSettings.themeColor;
    }
  }
};
</script>