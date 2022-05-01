<script>
import { fyo } from 'src/initFyo';
export default {
  name: 'Base',
  props: ['doc', 'printSettings'],
  data: () => ({ party: null, companyAddress: null }),
  methods: {
    format(row, fieldname) {
      let value = row.get(fieldname);
      return fyo.format(value, row.meta.getField(fieldname));
    }
  },
  async mounted() {
    await this.doc.loadLink('party');
    this.party = this.doc.getLink('party');
    await this.printSettings.loadLink('address');
    this.companyAddress = this.printSettings.getLink('address');
  },
  computed: {
    isSalesInvoice() {
      return this.doc.schemaName === 'SalesInvoice';
    }
  }
};
</script>
