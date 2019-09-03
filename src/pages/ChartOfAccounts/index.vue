<template>
  <div class="p-3" v-if="root">
    <branch
      :label="root.label"
      :balance="root.balance"
      :parentValue="''"
      :doctype="doctype"
      ref="root"
      :currency="root.currency"
      @updateBalance="updateBalance"
    />
  </div>
</template>
<script>
import frappe from 'frappejs';
import Branch from './Branch';

export default {
  components: {
    Branch
  },
  data() {
    return {
      root: null,
      doctype: 'Account'
    };
  },
  computed: {
    rootBalance() {
      return this.root.balance;
    }
  },
  async mounted() {
    this.settings = frappe.getMeta(this.doctype).treeSettings;
    const { currency } = await frappe.getSingle('AccountingSettings');
    this.root = {
      label: await this.settings.getRootLabel(),
      balance: 0,
      currency
    };
  },
  methods: {
    updateBalance(balance) {
      this.root.balance += balance;
    }
  }
};
</script>
