<template>
  <div :style="$.font" style="font-family: sans-serif;">
    <div class="row no-gutters pl-5 pr-5 mt-5">
      <div :style="$.regularFontSize" class="col-6">
        <company-address />
      </div>
      <div :style="$.regularFontSize" class="col-6 text-right">
        <h2 :style="$.headerFontColor">INVOICE</h2>
        <p :style="$.paraStyle">
          <strong>{{ doc.name }}</strong>
        </p>
        <p :style="$.paraStyle">{{ frappe.format(doc.date, 'Date') }}</p>
      </div>
    </div>
    <div class="row pl-5 mt-5">
      <div :style="$.regularFontSize" class="col-6 mt-1">
        <customer-address :customer="doc.customer" />
      </div>
    </div>
    <div :style="$.regularFontSize" class="row pl-5 pr-5 mt-5">
      <div class="col-12">
        <table class="table p-0">
          <thead>
            <tr :style="$.showBorderBottom">
              <th :style="$.hideBorderTop" class="text-left pl-0" style="width: 10%">{{ _("NO") }}</th>
              <th :style="$.hideBorderTop" class="text-left" style="width: 50%">{{ _("ITEM") }}</th>
              <th :style="$.hideBorderTop" class="text-left pl-0" style="width: 15%">{{ _("RATE") }}</th>
              <th :style="$.hideBorderTop" class="text-left" style="width: 10%">{{ _("QTY") }}</th>
              <th
                :style="$.hideBorderTop"
                class="text-right pr-1"
                style="width: 30%"
              >{{ _("AMOUNT") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in doc.items" :key="row.idx">
              <td class="text-left pl-1">{{ row.idx + 1 }}</td>
              <td class="text-left">{{ row.item }}</td>
              <td class="text-left pl-0">{{ row.rate }}</td>
              <td class="text-left">{{ row.quantity }}</td>
              <td class="text-right pr-1">{{ row.amount }}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-left pl-1"></td>
              <td colspan="2" :style="$.bold" class="text-left pl-0">SUBTOTAL</td>
              <td :style="$.bold" class="text-right pr-1">{{ doc.netTotal }}</td>
            </tr>
            <tr v-for="tax in doc.taxes" :key="tax.name">
              <td colspan="2" :style="$.hideBorderTop" class="text-left pl-1"></td>
              <td
                colspan="2"
                :style="$.bold"
                class="text-left pl-0"
              >{{ tax.account.toUpperCase() }} ({{ tax.rate }}%)</td>
              <td :style="$.bold" class="text-right pr-1">{{ tax.amount }}</td>
            </tr>
            <tr>
              <td colspan="2" :style="$.hideBorderTop" class="text-left pl-1"></td>
              <td
                colspan="2"
                :style="[$.bold, $.mediumFontSize, $.showBorderTop]"
                class="text-left pl-0"
              >TOTAL</td>
              <td
                :style="[$.bold, $.mediumFontSize, $.showBorderTop]"
                class="text-right pr-1"
                style="color: green;"
              >{{ doc.grandTotal }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row pl-5 pr-5 mt-5">
      <div :style="$.regularFontSize" class="col-12">
        <table class="table">
          <tbody>
            <tr :style="[$.bold, $.showBorderBottom]">
              <td :style="$.hideBorderTop" class="pl-0">NOTICE</td>
            </tr>
            <tr>
              <td class="pl-0">{{ doc.terms }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script>
import Styles from './InvoiceStyles';
import CompanyAddress from './CompanyAddress';
import CustomerAddress from './CustomerAddress';
export default {
  name: 'InvoiceTemplate1',
  components: {
    CompanyAddress,
    CustomerAddress
  },
  props: ['doc', 'themeColor', 'font'],
  data() {
    return {
      $: Styles
    };
  },
  watch: {
    themeColor: function() {
      this.setTheme();
    },
    font: function() {
      this.setTheme();
    }
  },
  async created() {
    this.$ = Styles;
    this.setTheme();
  },
  methods: {
    setTheme() {
      this.$.headerFontColor.color = this.themeColor;
      this.$.showBorderBottom.borderBottom = `0.22rem solid ${this.themeColor}`;
      this.$.showBorderTop.borderTop = `0.22rem solid ${this.themeColor}`;
      this.$.font.fontFamily = this.font;
    }
  }
};
</script>
