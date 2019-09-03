<template>
  <div>
    <div class="row no-gutters">
      <div v-if="showInvoiceCustomizer" class="col-3 mt-4 mx-auto"></div>
      <div class="col-8 mx-auto text-right mt-4">
        <f-button primary @click="$emit('send', $refs.printComponent.innerHTML)">{{ _('Send') }}</f-button>
        <f-button secondary @click="toggleCustomizer">{{ _('Customize') }}</f-button>
        <f-button secondary @click="$emit('makePDF', $refs.printComponent.innerHTML)">{{ _('PDF') }}</f-button>
      </div>
    </div>
    <div class="row no-gutters">
      <div v-if="showInvoiceCustomizer" class="col-3 mt-4 mx-auto">
        <invoice-customizer
          class="border"
          style="position: fixed"
          @closeInvoiceCustomizer="toggleCustomizer"
          @changeColor="changeColor($event)"
          @changeTemplate="changeTemplate($event)"
          @changeFont="changeFont($event)"
          @updateTemplateView="updateTemplateView"
        />
      </div>
      <div class="col-8 bg-white mt-4 mx-auto border shadow" ref="printComponent">
        <component
          :themeColor="themeColor"
          :font="font"
          :is="template"
          v-if="doc"
          :doc="doc"
          :key="usedForReRender"
        />
      </div>
    </div>
  </div>
</template>
<script>
import InvoiceTemplate1 from '@/../models/doctype/SalesInvoice/Templates/InvoiceTemplate1';
import InvoiceTemplate2 from '@/../models/doctype/SalesInvoice/Templates/InvoiceTemplate2';
import InvoiceTemplate3 from '@/../models/doctype/SalesInvoice/Templates/InvoiceTemplate3';
import InvoiceCustomizer from '@/components/InvoiceCustomizer';

const invoiceTemplates = {
  'Basic I': InvoiceTemplate1,
  'Basic II': InvoiceTemplate2,
  Modern: InvoiceTemplate3
};

export default {
  name: 'InvoicePrint',
  props: ['doc'],
  components: {
    InvoiceCustomizer
  },
  data() {
    return {
      showInvoiceCustomizer: false,
      themeColor: undefined,
      template: undefined,
      font: undefined,
      usedForReRender: 0
    };
  },
  async created() {
    await this.loadInvoice();
  },
  methods: {
    async loadInvoice() {
      await this.getTemplate();
      await this.getColor();
      await this.getFont();
    },
    async getTemplate() {
      let invoiceSettings = await frappe.getDoc('SalesInvoiceSettings');
      this.template = invoiceTemplates[invoiceSettings.template];
    },
    async getColor() {
      let invoiceSettings = await frappe.getDoc('SalesInvoiceSettings');
      this.themeColor = invoiceSettings.themeColor;
    },
    async getFont() {
      let invoiceSettings = await frappe.getDoc('SalesInvoiceSettings');
      this.font = invoiceSettings.font;
    },
    async toggleCustomizer() {
      await this.loadInvoice();
      this.showInvoiceCustomizer = !this.showInvoiceCustomizer;
    },
    changeColor(color) {
      this.themeColor = color;
    },
    changeTemplate(template) {
      this.template = invoiceTemplates[template];
    },
    changeFont(font) {
      this.font = font;
    },
    updateTemplateView() {
      this.usedForReRender += 1;
    }
  }
};
</script>