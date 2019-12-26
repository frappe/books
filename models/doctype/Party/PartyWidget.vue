<template>
  <div class="py-4" v-if="pendingInvoices.length">
    <div class="px-4 text-sm text-gray-600 mb-1">
      {{ _('Recent Invoices') }}
    </div>
    <div
      class="px-4 py-3 border-b hover:bg-gray-100 cursor-pointer"
      v-for="invoice in pendingInvoices"
      :key="invoice.name"
      @click="routeToForm(invoice)"
    >
      <div class="text-base">
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium">
            {{ invoice.name }}
          </span>
          <span>
            <component :is="getStatusBadge(invoice)" />
          </span>
        </div>
        <div class="flex justify-between">
          <span>
            {{ frappe.format(invoice.date, invoiceMeta.getField('date')) }}
          </span>
          <div>
            <span
              class="font-medium text-gray-900"
              v-if="fullyPaid(invoice) || notPaid(invoice)"
            >
              {{
                frappe.format(
                  invoice.baseGrandTotal,
                  invoiceMeta.getField('baseGrandTotal')
                )
              }}
            </span>
            <span class="text-gray-600" v-if="partiallyPaid(invoice)">
              ({{
                frappe.format(
                  invoice.baseGrandTotal,
                  invoiceMeta.getField('baseGrandTotal')
                )
              }})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import { getStatusColumn } from '../Transaction/Transaction';

export default {
  name: 'PartyWidget',
  props: ['doc'],
  data() {
    return {
      pendingInvoices: []
    };
  },
  computed: {
    invoiceDoctype() {
      let isCustomer = this.doc.doctype === 'Customer';
      return isCustomer ? 'SalesInvoice' : 'PurchaseInvoice';
    },
    invoiceMeta() {
      return frappe.getMeta(this.invoiceDoctype);
    }
  },
  mounted() {
    this.fetchPendingInvoices();
  },
  methods: {
    async fetchPendingInvoices() {
      let isCustomer = this.doc.doctype === 'Customer';
      let doctype = this.invoiceDoctype;
      let partyField = isCustomer ? 'customer' : 'supplier';
      this.pendingInvoices = await frappe.db.getAll({
        doctype,
        fields: [
          'name',
          'date',
          'outstandingAmount',
          'baseGrandTotal',
          'submitted'
        ],
        filters: {
          [partyField]: this.doc.name
        },
        limit: 3,
        orderBy: 'creation'
      });
    },
    getStatusBadge(doc) {
      let statusColumn = getStatusColumn();
      return statusColumn.render(doc);
    },
    routeToForm(doc) {
      this.$router.push(`/edit/${this.invoiceDoctype}/${doc.name}`);
    },
    fullyPaid(invoice) {
      return invoice.outstandingAmount == 0;
    },
    partiallyPaid(invoice) {
      return (
        invoice.outstandingAmount &&
        invoice.outstandingAmount !== invoice.baseGrandTotal
      );
    },
    notPaid(invoice) {
      return invoice.outstandingAmount === invoice.baseGrandTotal;
    }
  }
};
</script>
