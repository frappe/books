<template>
  <div :style="[$.regularFontSize, $.font]" style="font-family: sans-serif;">
    <div class="row no-gutters p-5" :style="$.headerColor">
      <div class="col-8 text-left">
        <h1>INVOICE</h1>
      </div>
      <div class="col-4 text-right">
        <company-address />
      </div>
    </div>
    <div class="row p-5 mt-4">
      <div class="col-4">
        <customer-address :customer="doc.customer" />
      </div>
      <div class="col-4">
        <p :style="[$.bold, $.mediumFontSize]">Invoice Number</p>
        <p :style="$.paraStyle">{{ doc.name }}</p>
        <br />
        <p :style="[$.bold, $.mediumFontSize]">Date</p>
        <p :style="$.paraStyle">{{doc.date}}</p>
      </div>
      <div class="col-4 text-right">
        <p :style="[$.bold, $.mediumFontSize]">Invoice Total</p>
        <h2 :style="$.fontColor">{{ doc.grandTotal }}</h2>
      </div>
    </div>
    <div class="row pl-5 pr-5 mt-3">
      <div class="col-12">
        <table class="table table-borderless p-0">
          <thead>
            <tr :style="[$.showBorderTop, $.fontColor]">
              <th class="text-left pl-0" style="width: 10%">{{ _("NO") }}</th>
              <th class="text-left" style="width: 50%">{{ _("ITEM") }}</th>
              <th class="text-left pl-0" style="width: 15%">{{ _("RATE") }}</th>
              <th class="text-left" style="width: 10%">{{ _("QTY") }}</th>
              <th class="text-right pr-1" style="width: 30%">{{ _("AMOUNT") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr :style="$.showBorderBottom" v-for="row in doc.items" :key="row.idx">
              <td class="text-left pl-1">{{ row.idx + 1 }}</td>
              <td class="text-left">{{ row.item }}</td>
              <td class="text-left pl-0">{{ row.rate }}</td>
              <td class="text-left">{{ row.quantity }}</td>
              <td class="text-right pr-1">{{ row.amount }}</td>
            </tr>
            <tr>
              <td colspan="5" style="padding: 4%"></td>
            </tr>
            <tr>
              <td colspan="2" class="text-left pl-1"></td>
              <td colspan="2" :style="[$.bold, $.fontColor]" class="text-left pl-0">SUBTOTAL</td>
              <td :style="$.bold" class="text-right pr-1">{{ doc.netTotal }}</td>
            </tr>
            <tr v-for="tax in doc.taxes" :key="tax.name">
              <td colspan="2" :style="$.hideBorderTop" class="text-left pl-1"></td>
              <td
                colspan="2"
                :style="[$.bold, $.fontColor]"
                class="text-left pl-0"
              >{{ tax.account.toUpperCase() }} ({{ tax.rate }}%)</td>
              <td :style="$.bold" class="text-right pr-1">{{ tax.amount }}</td>
            </tr>
            <tr>
              <td colspan="2" :style="$.hideBorderTop" class="text-left pl-1"></td>
              <td
                colspan="2"
                :style="[$.bold, $.fontColor, $.mediumFontSize]"
                class="text-left pl-0"
              >TOTAL</td>
              <td :style="[$.bold, $.mediumFontSize]" class="text-right pr-1">{{ doc.grandTotal }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row pl-5 pr-5 mt-5">
      <div class="col-12">
        <table class="table">
          <tbody>
            <tr :style="[$.bold, $.showNoticeBorderBottom]">
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
      this.$.fontColor.color = this.themeColor;
      this.$.headerColor.backgroundColor = this.themeColor;
      this.$.showBorderBottom.borderBottom = '0.1rem solid #e0e0d1';
      this.$.showNoticeBorderBottom.borderBottom = `0.22rem solid ${this.themeColor}`;
      this.$.showBorderTop.borderTop = `0.22rem solid ${this.themeColor}`;
      this.$.font.fontFamily = this.font;
    }
  }
};
</script>