<template>
  <div class="container">
    <div class="row">
      <div class="col-md-12 col-md-offset-4">
          <h1>Point of Sale</h1>
          <div class="row">
            <div class="col-md-4">
              <h6>Customer</h6>
                <frappe-control v-focus
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
                              <tr v-bind:class="{detailsCollapsed: detailsCollapsed}">
                                  <td>Subtotal:</td>
                                  <td style="text-align:right">{{ this.netTotal }}</td>
                                  <td></td>
                              </tr>
                              <tr v-bind:class="{detailsCollapsed: detailsCollapsed}">
                                  <td>Tax:</td>
                                  <td style="text-align:right">{{ this.grandTotal-this.netTotal }}</td>
                                  <td></td>
                              </tr>
                              <tr class="collapsible" @click="detailsCollapsed = !detailsCollapsed">
                                  <td>Total:</td>
                                  <td style="text-align:right">{{ this.grandTotal }}</td>
                                  
                                  <td v-if="detailsCollapsed" class="collapsible-icon">
                                    <feather-icon style="height: 16px" name="chevron-down" />
                                  </td>
                                  <td v-else class="collapsible-icon">
                                    <feather-icon style="height: 16px" name="chevron-up" />
                                  </td>
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
                    <div class="col-md-12">
                      <div class="list-group">
                          <button type="button" class="btn btn-primary" @click="checkout()">
                            <strong>Pay</strong>
                          </button>
                      </div>
                    </div>
                    <br>
                <!-- </div> -->
                </div>
                <div class="col-md-8 ml-0">
                  <div class="row">
                      <div class="col-md-6">
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
import Transaction from './Transaction';
import ItemList from './ItemList';
import Checkout from './Checkout';
import ModalMessage from './ModalMessage';
import frappe from 'frappejs';
import FrappeControl from 'frappejs/ui/components/controls/FrappeControl';
import { setTimeout } from 'timers';
import SubmitModal from './SubmitModal';

export default {
  components: {
    Transaction,
    ItemList,
    Checkout,
    SubmitModal
  },

  directives: {
    focus: {
      inserted: function(el) {
        el.focus();
      }
    }
  },

  data() {
    this.customerDocfield = {
      fieldname: 'customer',
      label: 'Customer',
      fieldtype: 'Link',
      target: 'Party'
    };
    this.itemDocfield = {
      fieldname: 'name',
      label: 'Item Name',
      fieldtype: 'Link',
      target: 'Item'
    };
    return {
      items: [],
      lineItems: [],
      allItems: [],
      grandTotal: 0,
      netTotal: 0,
      dataready: true,
      doc: null,
      value: '',
      itemValue: '',
      detailsCollapsed: true
    };
  },

  async created() {
    this.items = await frappe.db.getAll({
      doctype: 'Item',
      fields: ['name', 'rate', 'image']
    });
    this.allItems = this.items;
  },

  methods: {
    onItemClick: function(item) {
      if (this.value == '') {
        let options = {
          title: 'Error',
          component: ModalMessage,
          props: {
            modalMessage: 'No customer added.'
          }
        };
        this.$modal.show(options);
      } else {
        var found = this.itemPresent(item);
        if (!found) {
          this.lineItems.push({ item: item, numberOfItems: 1, editing: false });
        }
        this.invoice();
      }
    },

    itemPresent: function(item) {
      var found = false;
      for (var i = 0; i < this.lineItems.length; i++) {
        if (this.lineItems[i].item === item) {
          this.lineItems[i].numberOfItems++;
          found = true;
          break;
        }
      }
      return found;
    },

    toggleEdit: function(lineItem) {
      if (lineItem.editing == true) {
        this.invoice();
      }
      lineItem.editing = !lineItem.editing;
    },

    removeItem: function(lineItem) {
      for (var i = 0; i < this.lineItems.length; i++) {
        if (this.lineItems[i] === lineItem) {
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
      if (!value) this.items = this.allItems;
      this.itemValue = value;
      this.items = this.allItems.filter(item => item.name.includes(value));
    },

    currentItems() {
      var item = [];
      for (var i = 0; i < this.lineItems.length; i++) {
        console.log(
          this.lineItems[i].item.name + ' ' + this.lineItems[i].numberOfItems
        );
        var item_quantity = {
          item: this.lineItems[i].item.name,
          quantity: this.lineItems[i].numberOfItems
        };
        item.push(item_quantity);
      }
      return item;
    },

    noErrors() {
      if (this.value == '') {
        let options = {
          title: 'Error',
          component: ModalMessage,
          props: {
            modalMessage: 'No customer added.'
          }
        };
        this.$modal.show(options);
        return false;
      }

      if (!this.lineItems.length) {
        let options = {
          title: 'Error',
          component: ModalMessage,
          props: {
            modalMessage: 'No items added.'
          }
        };
        this.$modal.show(options);
        return false;
      }
      return true;
    },

    checkout() {
      if (!this.noErrors()) return;

      let options = {
        title: 'Total Amount: ' + this.grandTotal,
        component: Checkout,
        props: {
          customer: this.value,
          netTotal: this.netTotal,
          grandTotal: this.grandTotal,
          createInvoice: this.createInvoice
        }
      };
      this.$modal.show(options);
    },

    clearForm() {
      (this.lineItems = []),
        (this.grandTotal = 0),
        (this.netTotal = 0),
        (this.dataready = true),
        (this.doc = null),
        (this.value = ''),
        (this.itemValue = ''),
        (this.detailsCollapsed = true);

      this.$modal.hide();
    },

    openSubmitModal() {
      let submitModalOptions = {
        component: SubmitModal,
        props: {
          customer: this.value,
          lineItems: this.lineItems,
          netTotal: this.netTotal,
          grandTotal: this.grandTotal,
          clearForm: this.clearForm
        }
      };
      this.$modal.show(submitModalOptions);
    },

    async invoice() {
      this.dataready = false;
      var item = this.currentItems();
      this.doc = await frappe.newDoc({
        doctype: 'Invoice',
        name: 'something',
        customer: this.value,
        items: item
      });
      await this.doc.applyChange();
      this.grandTotal = this.doc.grandTotal;
      this.netTotal = this.doc.netTotal;
      console.log(this.grandTotal + ' ' + this.netTotal);
      this.dataready = true;
      console.log(this.doc);
    },

    async createInvoice(caller) {
      await this.doc.insert();
      let options = {
        title: 'Success',
        component: ModalMessage,
        props: {
          modalMessage: 'Invoice has been added.'
        }
      };
      // shut checkout modal
      caller.$modal.hide();
      this.openSubmitModal();
    }
  }
};
</script>
<style scoped>
.container {
  margin-top: 4rem;
}
.collapsible:hover {
  background-color: #f1f1f1;
}
.collapsible-icon {
  /* padding: 0%; */
  text-align: right;
  font-size: 16px;
  width: 16px;
}
.detailsCollapsed {
  display: none;
  overflow: hidden;
  transition: max-height 0.2s ease-out;
}
</style>