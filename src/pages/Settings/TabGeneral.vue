<script lang="ts">
import { Field } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import TabBase from './TabBase.vue';

export default defineComponent({
  extends: TabBase,
  name: 'TabGeneral',
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

      if (!this.doc?.enableDiscounting) {
        fields.push('enableDiscounting');
      }

      if (!this.doc?.enableInventory) {
        fields.push('enableInventory');
      }

      if (this.doc?.enableDiscounting) {
        fields.push('discountAccount');
      }

      if (fyo.singles.SystemSettings?.countryCode === 'in') {
        fields.push('gstin');
      }

      return fields
        .map((fieldname) => fyo.getField('AccountingSettings', fieldname))
        .filter(Boolean) as Field[];
    },
  },
});
</script>
