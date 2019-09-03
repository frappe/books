<template>
  <div :style="[$.regularFontSize, $.font]" style="font-family: sans-serif;">
    <div class="row no-gutters mt-5">
      <div class="col-6" :style="$.bgColor"></div>
      <div class="col-4 text-center" style="vertical-align: middle">
        <h1>INVOICE</h1>
      </div>
      <div class="col-2" :style="$.bgColor"></div>
    </div>
    <div class="row no-gutters mt-5">
      <div class="col-6 text-left pl-5">
        <company-address />
      </div>
      <div class="col-6 pr-5 text-right">
        <p :style="[$.bold, $.paraStyle, $.mediumFontSize]">{{ doc.name }}</p>
        <p :style="$.paraStyle">{{ frappe.format(doc.date, 'Date') }}</p>
      </div>
    </div>
    <div class="row no-gutters mt-5">
      <div class="col-6 text-left pl-5">
        <customer-address :customer="doc.customer" />
      </div>
      <div class="col-6"></div>
    </div>
    <div class="row mt-5 no-gutters">
      <div class="col-12">
        <table class="table">
          <tbody>
            <tr>
              <td
                :style="[$.bold, $.showBorderRight, $.tablePadding]"
                style="width: 15"
                class="pl-5"
              >{{ _("NO") }}</td>
              <td
                :style="[$.bold, $.showBorderRight, $.tablePadding]"
                style="width: 40%"
              >{{ _("ITEM") }}</td>
              <td
                class="text-left"
                :style="[$.bold, $.showBorderRight, $.tablePadding]"
                style="width: 20%"
              >{{ _("RATE") }}</td>
              <td
                :style="[$.bold, $.showBorderRight, $.tablePadding]"
                style="width: 10%"
              >{{ _("QTY") }}</td>
              <td
                class="text-right pr-5"
                :style="[$.bold, $.tablePadding]"
                style="width: 20%"
              >{{ _("AMOUNT") }}</td>
            </tr>
            <tr v-for="row in doc.items" :key="row.idx">
              <td :style="$.tablePadding" class="pl-5 pr-5">{{ row.idx + 1 }}</td>
              <td :style="$.tablePadding">{{ row.item }}</td>
              <td
                :style="$.tablePadding"
                class="text-left"
              >{{ frappe.format(row.rate, 'Currency') }}</td>
              <td :style="$.tablePadding">{{ row.quantity }}</td>
              <td :style="$.tablePadding" class="text-right pr-5">{{ row.amount }}</td>
            </tr>
            <tr>
              <td colspan="5" style="padding: 4%"></td>
            </tr>
            <tr>
              <td colspan="2" :style="[$.hideBorderTop, $.tablePadding]"></td>
              <td :style="$.tablePadding" colspan="2">SUBTOTAL</td>
              <td :style="$.tablePadding" class="text-right pr-5">{{ doc.netTotal }}</td>
            </tr>
            <tr v-for="tax in doc.taxes" :key="tax.name">
              <td colspan="2" :style="[$.hideBorderTop, $.tablePadding]"></td>
              <td
                :style="$.tablePadding"
                med
                colspan="2"
              >{{ tax.account.toUpperCase() }} ({{ tax.rate }}%)</td>
              <td :style="$.tablePadding" class="text-right pr-5">{{ tax.amount }}</td>
            </tr>
            <tr>
              <td colspan="2" :style="[$.hideBorderTop, $.tablePadding]"></td>
              <td :style="[$.bold, $.tablePadding, $.mediumFontSize]" colspan="2">TOTAL</td>
              <td
                :style="[$.bold, $.tablePadding, $.mediumFontSize]"
                class="text-right pr-5"
              >{{ doc.grandTotal }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row mt-5">
      <div :style="$.regularFontSize" class="col-12">
        <table class="table">
          <tbody>
            <tr :style="[$.bold, $.showBorderBottom]">
              <td :style="$.hideBorderTop" class="pl-5">NOTICE</td>
            </tr>
            <tr>
              <td class="pl-5">{{ doc.terms }}</td>
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
  name: 'InvoicePrint',
  props: ['doc', 'themeColor', 'font'],
  components: {
    CompanyAddress,
    CustomerAddress
  },
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
      this.$.bgColor.backgroundColor = this.themeColor;
      this.$.showBorderBottom.borderBottom = `0.22rem solid ${this.themeColor}`;
      this.$.font.fontFamily = this.font;
    }
  }
};
</script>