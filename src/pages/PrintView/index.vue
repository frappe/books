<template>
  <div class="bg-light">
    <page-header :title="doctype" />
    <div class="row mt-4 no-gutters">
      <div v-if="showInvoiceCustomizer" class="col-3 mx-auto"></div>
      <div class="col-8 mx-auto text-right">
        <f-button secondary @click="toggleInvoiceCustomizer">{{ _('Customize') }}</f-button>
        <f-button primary @click="makePDF">{{ _('PDF') }}</f-button>
      </div>
    </div>
    <div class="row no-gutters">
      <div v-if="showInvoiceCustomizer" class="col-3 mt-4 border mx-auto">
        <invoice-customizer @closeInvoiceCustomizer="toggleInvoiceCustomizer" @changeInvoice="loadInvoice($event)" />
      </div>      
      <div ref="printComponent" class="col-8 bg-white mt-4 mx-auto border shadow">
        <component :themeColor="themeColor" :is="printComponent" v-if="doc" :doc="doc" />
      </div>
    </div>
  </div>
</template>
<script>
import PageHeader from '@/components/PageHeader';
import InvoiceCustomizer from '@/components/InvoiceCustomizer';
import InvoicePrint1 from '@/../models/doctype/Invoice/InvoicePrint1'
import InvoicePrint2 from '@/../models/doctype/Invoice/InvoicePrint2'
import InvoicePrint3 from '@/../models/doctype/Invoice/InvoicePrint3'

const invoiceTemplates = {
  'Basic I': InvoicePrint1,
  'Basic II': InvoicePrint3,
  'Modern': InvoicePrint2
}

const printComponents = {
  Invoice: null
};

export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  components: {
    PageHeader,
    InvoiceCustomizer
  },
  data() {
    return {
      doc: null,
      printComponent: null,
      themeColor: '#000000',
      showInvoiceCustomizer: false
    }
  },
  async mounted() {
    this.loadInvoice();
  },
  methods: {
    async loadInvoice(eventValues) {
      console.log(eventValues);
      this.doc = await frappe.getDoc(this.doctype, this.name);
      let invoiceSettings = eventValues || await frappe.getDoc('InvoiceSettings');
      this.themeColor = invoiceSettings.themeColor;
      let templateFile = invoiceTemplates[invoiceSettings.invoiceTemplate];
      printComponents[this.doctype] = templateFile;
      this.printComponent = printComponents[this.doctype];
    },
    makePDF() {
      frappe.call({
        method: 'print-pdf',
        args: {
          doctype: this.doctype,
          name: this.name,
          html: this.$refs.printComponent.innerHTML
        }
      })
    },
    async toggleInvoiceCustomizer() {
      this.showInvoiceCustomizer = !this.showInvoiceCustomizer;
    }
  }
}
</script>