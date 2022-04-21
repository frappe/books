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
import TwoColumnForm from 'src/components/TwoColumnForm';
import { fyo } from 'src/initFyo';

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
    this.doc = await fyo.doc.getDoc(
      'AccountingSettings',
      'AccountingSettings',
      {
        skipDocumentCache: true,
      }
    );
  },
  computed: {
    fields() {
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
      ].map((fieldname) => fyo.getField('AccountingSettings', fieldname));
    },
  },
  methods: {
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
