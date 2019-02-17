<template>
  <div class="p-3" v-if="root">
    <branch :label="root.label" :balance="root.balance" :parentValue="''" :doctype="doctype" ref="root"/>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Branch from './Branch';
import { setTimeout } from 'timers';

export default {
  components: {
    Branch,
  },
  data() {
    return {
      root: null,
      doctype: "Account"
    }
  },
  async mounted() {
    this.settings = frappe.getMeta(this.doctype).treeSettings;
    this.root = {
      label: await this.settings.getRootLabel(),
      balance: 'Net Worth'
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
    }
  }
}
</script>
