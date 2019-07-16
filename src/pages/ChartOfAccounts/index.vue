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
    async getChildren(parentValue) {
      let filters = {
        [this.settings.parentField]: parentValue
      };

      const children = await frappe.db.getAll({
        doctype: this.doctype,
        filters,
        fields: [this.settings.parentField, 'isGroup', 'name', 'balance'],
        orderBy: 'name',
        order: 'asc'
      });

      return children.map(c => {
        c.label = c.name;
        c.balance = c.balance;
        return c;
      });
    },
    updateBalance(balance) {
      this.root.balance += balance;
    }
  }
};
</script>
