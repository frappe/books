<template>
  <div>
    <page-header title="Reports" />
    <div class="row">
      <div class="col-8 mx-auto">
        <clickable-card
          class="mt-2"
          title="General Ledger"
          description="List of all ledger entries booked against all accounts"
          @click="routeTo('general-ledger', { 'referenceType': 'Invoice' })"
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
      </div>
    </div>
  </div>
</template>
<script>
import PageHeader from '../components/PageHeader';
import ClickableCard from '../components/ClickableCard';

export default {
  name: 'Report',
  components: {
    PageHeader,
    ClickableCard
  },
  methods: {
    routeTo(route, filters) {
      const query = new URLSearchParams(filters);
      this.$router.push(`/report/${route}?${query}`);
    }
  }
}
</script>
