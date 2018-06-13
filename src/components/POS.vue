<template>
    <div class="container">
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <h1>Point of Sale</h1>
                <div class="row">
                    <div class="col-md-6">
                        <transaction :items="lineItems" :edit="toggleEdit" :remove="removeItem"></transaction>
                    </div>
                    <div class="col-md-6">
                        <item-list :items="items" :add="onItemClick"></item-list>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import Transaction from "./Transaction";
import ItemList from "./ItemList";
import frappe from "frappejs";

export default {
  components: {
    Transaction,
    ItemList
  },
  data() {
    return {
      items: [],
      lineItems: []
    };
  },
  async created(){ 
  this.items=await frappe.db.getAll({
          doctype: "Item",
          fields: ["name", "rate"]
        })
  },
  methods: {
    onItemClick: function(item) {
      console.log("in", item);
      var found = false;

      for (var i = 0; i < this.lineItems.length; i++) {
        if (this.lineItems[i].item === item) {
          this.lineItems[i].numberOfItems++;
          found = true;
          break;
        }
      }

      if (!found) {
        this.lineItems.push({ item: item, numberOfItems: 1, editing: false });
      }
    },
    toggleEdit: function(lineItem) {
      lineItem.editing = !lineItem.editing;
    },
    removeItem: function(lineItem) {
      for (var i = 0; i < this.lineItems.length; i++) {
        if (this.lineItems[i] === lineItem) {
          this.lineItems.splice(i, 1);
          break;
        }
      }
    },
  }
};
</script>
<style>
</style>
