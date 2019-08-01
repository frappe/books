<template>
  <div class="bg-white">
    <page-header :breadcrumbs="breadcrumbs" />
    <component :is="printComponent" v-if="doc" :doc="doc" @send="send" @makePDF="makePDF" />
  </div>
</template>
<script>
import PageHeader from '@/components/PageHeader';
import SalesInvoicePrint from '@/../models/doctype/SalesInvoice/SalesInvoicePrint';
import GSTR3BPrintView from '@/../models/doctype/GSTR3B/GSTR3BPrintView';
import EmailSend from '../Email/EmailSend';

const printComponents = {
  SalesInvoice: SalesInvoicePrint,
  GSTR3B: GSTR3BPrintView
};
export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  components: {
    PageHeader
  },
  computed: {
    breadcrumbs() {
      if (this.doc)
        return [
          {
            title: this.meta.label || this.meta.name,
            route: '#/list/' + this.doctype
          },
          {
            title: this.doc._notInserted
              ? 'New ' + this.meta.label || this.meta.name
              : this.doc.name,
            route: `#/edit/${this.doctype}/${this.name}`
          },
          {
            title: 'Print',
            route: ``
          }
        ];
    },
    meta() {
      return frappe.getMeta(this.doctype);
    }
  },
  data() {
    return {
      doc: undefined,
      printComponent: undefined,
      showInvoiceCustomizer: false
    };
  },
  async mounted() {
    this.doc = await frappe.getDoc(this.doctype, this.name);
    this.printComponent = printComponents[this.doctype];
  },
  methods: {
    makePDF(html) {
      frappe.call({
        method: 'print-pdf',
        args: {
          doctype: this.doctype,
          name: this.name,
          html
        }
      });
    },
    async send(html) {
      let doc = await frappe.getNewDoc('Email');
      let emailFields = frappe.getMeta('Email').fields;
      var file_path = this.name;
      doc['fromEmailAddress'] = this.selectedId;
      this.makePDF(html);
      doc['filePath'] = this.name + '.pdf';
      this.$modal.show({
        component: EmailSend,
        props: {
          doctype: doc.doctype,
          name: doc.name
        },
        modalProps: {
          title: `Send ${this.doctype}`,
          footerMessage: `${this.doctype} attached along..`
        }
      });
      doc.on('afterInsert', data => {
        this.$modal.hide();
      });
    }
  }
};
</script>