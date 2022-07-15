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
      const fields = [
        'fullname',
        'companyName',
        'country',
        'bankName',
        'currency',
        'fiscalYearStart',
        'fiscalYearEnd',
        'writeOffAccount',
        'roundOffAccount',
      ];

      if (!this.doc.enableDiscounting) {
        fields.push('enableDiscounting');
      }

      if (this.doc.enableDiscounting) {
        fields.push('discountAccount');
      }

      if (fyo.singles.SystemSettings.countryCode === 'in') {
        fields.push('gstin');
      }

      return fields.map((fieldname) =>
        fyo.getField('AccountingSettings', fieldname)
      );
    },
  },
  methods: {
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
