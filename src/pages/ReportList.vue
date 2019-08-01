<template>
  <div>
    <page-header title="Reports" />
    <div class="row">
      <div class="col-8 mx-auto">
        <clickable-card
          class="mt-2"
          title="General Ledger"
          description="List of all ledger entries booked against all accounts"
          @click="routeTo('general-ledger', { 'referenceType': 'SalesInvoice' })"
        />
        <clickable-card
          class="mt-2"
          title="Profit and Loss"
          description="Profit and Loss statement"
          @click="routeTo('profit-and-loss')"
        />
        <clickable-card
          class="mt-2"
          title="Trial Balance"
          description="Trial Balance"
          @click="routeTo('trial-balance')"
        />
        <clickable-card
          class="mt-2"
          title="Sales Register"
          description="Sales transactions for a given period with invoiced amount and tax details"
          @click="routeTo('sales-register')"
        />
        <clickable-card
          class="mt-2"
          title="Bank Reconciliation"
          description="Bank Reconciliation statement"
          @click="routeTo('bank-reconciliation',{'toDate' : (new Date()).toISOString()})"
        />
        <clickable-card
          v-if="country === 'India'"
          class="mt-2"
          title="Goods and Service Tax"
          description="See your goods and services tax here."
          @click="routeTo('gst-taxes',{'toDate' : (new Date()).toISOString()})"
        />
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import PageHeader from '../components/PageHeader';
import ClickableCard from '../components/ClickableCard';

export default {
  name: 'Report',
  data() {
    return {
      country: ''
    };
  },
  components: {
    PageHeader,
    ClickableCard
  },
  async created() {
    const doc = await frappe.getDoc('AccountingSettings');
    this.country = doc.country;
  },
  methods: {
    routeTo(route, filters) {
      const query = new URLSearchParams(filters);
      this.$router.push(`/report/${route}?${query}`);
    }
  }
};
</script>
