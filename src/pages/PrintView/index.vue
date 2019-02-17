<template>
  <div class="bg-light">
    <page-header :title="doctype" />
    <div class="row no-gutters">
      <div class="col-8 mx-auto text-right mt-4">
        <f-button primary @click="makePDF">{{ _('PDF') }}</f-button>
      </div>
      <div ref="printComponent" class="form-container col-8 bg-white mt-4 mx-auto border">
        <component :is="printComponent" v-if="doc" :doc="doc" />
      </div>
    </div>
  </div>
</template>
<script>
import PageHeader from '@/components/PageHeader';
import InvoicePrint from '@/../models/doctype/Invoice/InvoicePrint'

const printComponents = {
  Invoice: InvoicePrint
};

export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  components: {
    PageHeader
  },
  data() {
    return {
      doc: null,
      printComponent: null
    }
  },
  async mounted() {
    this.doc = await frappe.getDoc(this.doctype, this.name);
    this.printComponent = printComponents[this.doctype];
  },
  methods: {
    makePDF() {
      frappe.call({
        method: 'print-pdf',
        args: {
          doctype: this.doctype,
          name: this.name,
          html: this.$refs.printComponent.innerHTML
        }
      })
    }
  }
}
</script>
