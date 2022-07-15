<script>
import { fyo } from 'src/initFyo';
export default {
  name: 'Base',
  props: { doc: Object, printSettings: Object },
  data: () => ({ party: null, companyAddress: null, partyAddress: null }),
  methods: {
    format(row, fieldname) {
      const value = row.get(fieldname);
      return fyo.format(value, fyo.getField(row.schemaName, fieldname));
    },
  },
  async mounted() {
    await this.printSettings.loadLink('address');
    this.companyAddress = this.printSettings.getLink('address');

    await this.doc.loadLink('party');
    this.party = this.doc.getLink('party');
    this.partyAddress = this.party.getLink('address')?.addressDisplay ?? null;
  },
  computed: {
    isSalesInvoice() {
      return this.doc.schemaName === 'SalesInvoice';
    },
    showHSN() {
      return this.doc.items.map((i) => i.hsnCode).every(Boolean);
    },
    totalDiscount() {
      return this.doc.getTotalDiscount();
    },
  },
};
</script>
