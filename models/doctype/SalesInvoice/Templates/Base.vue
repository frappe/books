<script>
import frappe from 'frappejs';
export default {
  name: 'Base',
  props: ['doc', 'printSettings'],
  data: () => ({ party: null, companyAddress: null }),
  methods: {
    format(row, fieldname) {
      let value = row.get(fieldname);
      return frappe.format(value, row.meta.getField(fieldname));
    }
  },
  async mounted() {
    await this.doc.loadLink(this.partyField);
    this.party = this.doc.getLink(this.partyField);
    await this.printSettings.loadLink('address');
    this.companyAddress = this.printSettings.getLink('address');
  },
  computed: {
    partyField() {
      return this.doc.doctype === 'SalesInvoice' ? 'customer' : 'supplier';
    }
  }
};
</script>
