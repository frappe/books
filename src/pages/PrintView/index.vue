<template>
  <div class="bg-light">
    <page-header :title="doctype" />
    <div class="form-container col-8 bg-white mt-4 ml-auto mr-auto border">
      <component :is="printComponent" v-if="doc" :doc="doc" />
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
  }
}
</script>
