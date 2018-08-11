<template>

    <div class="container">
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <h1>Point of Sale</h1>
                <div class="row">
                    <div class="col-md-6">
                        <h6>Customer</h6>
                        <frappe-control
                            :docfield="customerDocfield"
                            :value="value"
                            @change="value => updateValue(this.customerDocfield.fieldname, value)"
                            :onlyInput="true"
                        />
                        <br>
                        <br>
                        <transaction :items="lineItems" :edit="toggleEdit" :remove="removeItem" ></transaction>
                        <div v-if="dataready">
                          <table class="table">
                              <tbody>
                                  <tr>
                                      <td>Subtotal:</td>
                                      <td style="text-align:right">{{ this.netTotal }}</td>
                                  </tr>
                                  <tr>
                                      <td>Tax:</td>
                                      <td style="text-align:right">{{ this.grandTotal-this.netTotal }}</td>
                                  </tr>
                                  <tr>
                                      <td>Total:</td>
                                      <td style="text-align:right">{{ this.grandTotal }}</td>
                                  </tr>
                                </tbody>
                          </table>
                        </div>
                        <br>
                        <!-- <div class="row">
                            <div class="col-md-6">
                                <div class="list-group">
                                    <button class="list-group-item item" @click="createInvoice()">
                                        <strong>Create Invoice</strong>
                                    </button>
                                </div>
                            </div> -->
                            <div class="col-md-6">
                                <div class="list-group">
                                    <button type="button" class="list-group-item item" @click="checkout()">
                                         <strong>Pay</strong>
                                    </button>
                                </div>
                            </div>
                        <!-- </div> -->
                    </div>

                    <div class="col-md-6">
                        <div class="row">
                            <div class="col-md-12">
                                <h6>Item Select</h6>
                                <frappe-control
                                    :docfield="itemDocfield"
                                    :value="itemValue"
                                    @change="itemValue => filterItemList(itemDocfield.fieldname, itemValue)"
                                    :onlyInput="true"
                                />
                            </div>
                        </div>
                        <br>
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
import Checkout from "./Checkout";
import ModalMessage from "./ModalMessage";
import frappe from "frappejs";
import FrappeControl from 'frappejs/ui/components/controls/FrappeControl';

export default {
  components: {
    Transaction,
    ItemList,
    Checkout
  },

  data() {
    this.customerDocfield={
      fieldname: "customer",
      label: "Customer",
      fieldtype: "Link",
      target: "Party"
    };
    this.itemDocfield={
      fieldname: "name",
      label: "Item Name",
      fieldtype: "Link",
      target: "Item"
    };
    return {
      items: [],
      lineItems: [],
      allItems: [],
      grandTotal: 0 ,
      netTotal: 0,
      dataready: true,
      doc:null,
      value:"",
      itemValue: ""
    };
  },

  async created() { 
  this.items = await frappe.db.getAll({
      doctype: "Item",
      fields: ["name", "rate"],
  });
  this.allItems = this.items;
  },

  methods: {
    onItemClick: function(item) {
      if(this.value=="") {
        let options = {
            title: "Error",
            component: ModalMessage,
            props: {
                modalMessage: "No customer added.",
            }
        }
        this.$modal.show(options);
      }
      else {
          var found = this.itemPresent(item);  
          if(!found) {
              this.lineItems.push({ item: item, numberOfItems: 1, editing: false });
          }
          this.invoice();
      }
    },

    itemPresent: function(item) {
        var found = false;
        for(var i = 0; i < this.lineItems.length; i++) {
            if(this.lineItems[i].item === item) {
                this.lineItems[i].numberOfItems++;
                found = true;
                break;
            }
        }
        return found;
    },

    toggleEdit: function(lineItem) {
        if(lineItem.editing==true){
            this.invoice();
        }
        lineItem.editing = !lineItem.editing;
    },

    removeItem: function(lineItem) {
        for(var i = 0; i < this.lineItems.length; i++) {
            if(this.lineItems[i] === lineItem) {
                this.lineItems.splice(i, 1);
                break;
            }
        }
        this.invoice();
    },

    updateValue(field, value) {
        this.value = value;
    },

    filterItemList(field, value) {
        if(!value)
            this.items = this.allItems;
        this.itemValue = value;
        this.items = this.allItems.filter((item)=> item.name.includes(value));
    },

    currentItems() {
        var item=[];
        for(var i=0;i<this.lineItems.length;i++) {
            console.log(this.lineItems[i].item.name+" "+this.lineItems[i].numberOfItems);
            var item_quantity = {
                item:this.lineItems[i].item.name,
                quantity:this.lineItems[i].numberOfItems
            };
            item.push(item_quantity);
        }
        return item;
    },

    checkout() {
        let options = {
            title: "Total Amount: "+this.grandTotal,
            component: Checkout,
            props: {
                customer: this.value, 
                lineItems: this.lineItems, 
                netTotal: this.netTotal, 
                grandTotal: this.grandTotal
            }
        }
        this.$modal.show(options);
    },

    async invoice() {
        this.dataready=false;
        var item= this.currentItems();
        this.doc = await frappe.newDoc({
            doctype: 'Invoice', 
            name: 'something',
            customer:this.value,
            items:item
        });
        await this.doc.applyChange();
        this.grandTotal=this.doc.grandTotal;
        this.netTotal=this.doc.netTotal;
        console.log(this.grandTotal+" "+this.netTotal);
        this.dataready=true;
        console.log(this.doc);
    },

    // async createInvoice(){
    //     if(!this.lineItems.length){
    //         let options = {
    //         title: "Error",
    //         component: ModalMessage,
    //         props: {
    //             modalMessage: "No items added.",
    //         }
    //     }
    //     this.$modal.show(options);
    //     }
    //     else{
    //         await this.doc.insert();
    //         let options = {
    //         title: "Success",
    //         component: ModalMessage,
    //         props: {
    //             modalMessage: "Invoice has been added.",
    //         }
    //     }
    //     this.$modal.show(options);
    //     }
    // }
  }
};
</script>
<style scoped>
.container{
    margin-top: 4rem;
}
</style>