<script>
export default {
  name: 'Base',
  props: { doc: Object, printSettings: Object },
  data: () => ({ party: null, companyAddress: null, partyAddress: null }),
  async mounted() {
    await this.printSettings.loadLink('address');
    this.companyAddress = this.printSettings.getLink('address');

    await this.doc.loadLink('party');
    this.party = this.doc.getLink('party');
    this.partyAddress = this.party.getLink('address')?.addressDisplay ?? null;

    if (this.fyo.store.isDevelopment) {
      window.bt = this;
    }
  },
  methods: {
    getFormattedField(fieldname, doc) {
      doc ??= this.doc;
      const field = doc.fieldMap[fieldname];
      const value = doc.get(fieldname);
      if (Array.isArray(value)) {
        return this.getFormattedChildDocList(fieldname);
      }
      return this.fyo.format(value, field, doc);
    },
    getFormattedChildDocList(fieldname) {
      const formattedDocs = [];
      for (const childDoc of this.doc?.[fieldname] ?? {}) {
        formattedDocs.push(this.getFormattedChildDoc(childDoc));
      }
      return formattedDocs;
    },
    getFormattedChildDoc(childDoc) {
      const formattedChildDoc = {};
      for (const field of childDoc?.schema?.fields) {
        if (field.meta) {
          continue;
        }

        formattedChildDoc[field.fieldname] = this.getFormattedField(
          field.fieldname,
          childDoc
        );
      }
      return formattedChildDoc;
    },
  },
  computed: {
    currency() {
      return this.doc.isMultiCurrency
        ? this.doc.currency
        : this.fyo.singles.SystemSettings.currency;
    },
    isSalesInvoice() {
      return this.doc.schemaName === 'SalesInvoice';
    },
    showHSN() {
      return this.doc.items.map((i) => i.hsnCode).every(Boolean);
    },
    totalDiscount() {
      return this.doc.getTotalDiscount();
    },
    formattedTotalDiscount() {
      if (!this.totalDiscount?.float) {
        return '';
      }

      const totalDiscount = this.fyo.format(this.totalDiscount, {
        fieldname: 'Total Discount',
        fieldtype: 'Currency',
        currency: this.currency,
      });

      return `- ${totalDiscount}`;
    },
    printObject() {
      return {
        isSalesInvoice: this.isSalesInvoice,
        font: this.printSettings.font,
        color: this.printSettings.color,
        showHSN: this.showHSN,
        displayLogo: this.printSettings.displayLogo,
        discountAfterTax: this.doc.discountAfterTax,
        logo: this.printSettings.logo,
        companyName: this.fyo.singles.AccountingSettings.companyName,
        email: this.printSettings.email,
        phone: this.printSettings.phone,
        address: this.companyAddress?.addressDisplay,
        gstin: this.fyo.singles?.AccountingSettings?.gstin,
        invoiceName: this.doc.name,
        date: this.getFormattedField('date'),
        partyName: this.party?.name,
        partyAddress: this.partyAddress,
        partyGSTIN: this.party?.gstin,
        terms: this.doc.terms,
        netTotal: this.getFormattedField('netTotal'),
        items: this.getFormattedField('items'),
        taxes: this.getFormattedField('taxes'),
        grandTotal: this.getFormattedField('grandTotal'),
        totalDiscount: this.formattedTotalDiscount,
      };
    },
  },
};
</script>
