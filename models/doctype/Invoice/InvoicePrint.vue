<template>
    <component :themeColor="color" :font="fontFamily" :is="invoiceTemplate" v-if="doc" :doc="doc"/>
</template>
<script>
import InvoiceTemplate1 from '@/../models/doctype/Invoice/Templates/InvoiceTemplate1';
import InvoiceTemplate2 from '@/../models/doctype/Invoice/Templates/InvoiceTemplate2';
import InvoiceTemplate3 from '@/../models/doctype/Invoice/Templates/InvoiceTemplate3';

const invoiceTemplates = {
  'Basic I': InvoiceTemplate1,
  'Basic II': InvoiceTemplate2,
  'Modern': InvoiceTemplate3
};

export default {
  name: 'InvoicePrint',
  props: ['doc', 'themeColor', 'template', 'font'],
  data() {
    return {
      color: undefined,
      fontFamily: undefined,
      invoiceTemplate: undefined
    };
  },
  watch: {
    themeColor: async function() {
      await this.loadInvoice();
    },
    font: async function() {
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
      this.color = this.themeColor !== undefined ? this.themeColor : await this.getColor();
      this.fontFamily = this.font !== undefined ? this.font : await this.getFont();
      let template = this.template !== undefined ? this.template : await this.getTemplate();
      let templateFile = invoiceTemplates[template];
      this.invoiceTemplate = templateFile;
    },
    async getTemplate() {
      let invoiceSettings = await frappe.getDoc('InvoiceSettings');
      return invoiceSettings.template;
    },
    async getColor() {
      let invoiceSettings = await frappe.getDoc('InvoiceSettings');
      return invoiceSettings.themeColor;
    },
    async getFont() {
      let invoiceSettings = await frappe.getDoc('InvoiceSettings');
      return invoiceSettings.font;
    }
  }
};
</script>