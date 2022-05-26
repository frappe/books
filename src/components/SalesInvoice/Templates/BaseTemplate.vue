<script>
import { fyo } from 'src/initFyo';
export default {
  name: 'Base',
  props: { doc: Object, printSettings: Object },
  data: () => ({ party: null, companyAddress: null }),
  methods: {
    format(row, fieldname) {
      const value = row.get(fieldname);
      return fyo.format(value, fyo.getField(row.schemaName, fieldname));
    },
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
    },
  },
};
</script>
