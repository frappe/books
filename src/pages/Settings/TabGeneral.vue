<template>
  <div>
    <TwoColumnForm
      v-if="doc"
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :emit-change="true"
      @change="forwardChangeEvent"
    />
  </div>
</template>

<script>
import frappe from 'fyo';
import TwoColumnForm from 'src/components/TwoColumnForm';

export default {
  name: 'TabGeneral',
  emits: ['change'],
  components: {
    TwoColumnForm,
  },
  data() {
    return {
      doc: null,
    };
  },
  async mounted() {
    this.doc = await frappe.doc.getDoc('AccountingSettings', 'AccountingSettings', {
      skipDocumentCache: true,
    });
  },
  computed: {
    fields() {
      let meta = frappe.getMeta('AccountingSettings');
      return [
        'companyName',
        'country',
        'bankName',
        'currency',
        'writeOffAccount',
        'roundOffAccount',
        'fiscalYearStart',
        'fiscalYearEnd',
        'gstin',
      ].map((fieldname) => meta.getField(fieldname));
    },
  },
  methods: {
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
