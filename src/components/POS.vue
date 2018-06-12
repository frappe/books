<template>
    <div class="container">
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <h1>Point of Sale</h1>
                <div class="row">
                    <div class="col-md-6">
                        <Transaction :items="lineItems" :edit="toggleEdit" :remove="removeItem"></Transaction>
                    </div>
                    <div class="col-md-6">
                        <ItemList :items="items" :add="onItemClick"></ItemList>
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
      items: [
        {
          name: "Apple",
          price: 2.99
        },
        {
          name: "Orange",
          price: 0.99
        },
        {
          name: "Banana",
          price: 5.99
        },
        {
          name: "TV",
          price: 199.99
        },
        {
          name: "X-Box One",
          price: 299.99
        },
        {
          name: "iPhone 6 Plus",
          price: 299.99
        },
        {
          name: "Cup",
          price: 3.99
        },
        {
          name: "Yogurt",
          price: 0.49
        },
        {
          name: "Hat",
          price: 9.99
        }
      ],
      lineItems: []
    };
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
    }
  }
};
</script>
<style>
</style>