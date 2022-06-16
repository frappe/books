<template>
  <div v-if="pendingInvoices.length">
    <div
      class="
        px-4
        text-sm text-gray-600
        border-b
        flex
        items-center
        h-row-smallest
      "
    >
      {{ t`Recent Invoices` }}
    </div>

    <!-- Invoice List -->
    <div
      class="px-4 py-4 border-b hover:bg-gray-50 cursor-pointer text-base"
      v-for="invoice in pendingInvoices"
      :key="invoice.name"
      @click="routeToForm(invoice)"
    >
      <!-- Invoice Name & Status -->
      <div class="flex justify-between items-center mb-1">
        <span class="font-medium">
          {{ invoice.name }}
        </span>
        <span>
          <component :is="getStatusBadge(invoice)" />
        </span>
      </div>

      <!-- Invoice Date & Amount -->
      <div class="flex justify-between text-gray-900">
        <span>
          {{ fyo.format(invoice.date, getInvoiceField(invoice, 'date')) }}
        </span>
        <div>
          <!-- Paid Amount -->
          <span>
            {{
              fyo.format(
                amountPaid(invoice),
                getInvoiceField(invoice, 'baseGrandTotal')
              )
            }}
          </span>

          <!-- Outstanding Amount -->
          <span class="text-gray-600 font-medium" v-if="!fullyPaid(invoice)">
            ({{
              fyo.format(
                invoice.outstandingAmount,
                getInvoiceField(invoice, 'outstandingAmount')
              )
            }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Doc } from 'fyo/model/doc';
import { PartyRoleEnum } from 'models/baseModels/Party/types';
import { getTransactionStatusColumn } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';

export default {
  name: 'PartyWidget',
  props: { doc: Doc },
  data() {
    return {
      pendingInvoices: [],
    };
  },
  computed: {
    invoiceSchemaNames() {
      switch (this.doc.get('role')) {
        case PartyRoleEnum.Customer:
          return [ModelNameEnum.SalesInvoice];
        case PartyRoleEnum.Supplier:
          return [ModelNameEnum.PurchaseInvoice];
        case PartyRoleEnum.Both:
        default:
          return [ModelNameEnum.SalesInvoice, ModelNameEnum.PurchaseInvoice];
      }
    },
  },
  mounted() {
    this.fetchPendingInvoices();
  },
  methods: {
    getInvoiceField(invoice, fieldname) {
      return fyo.getField(invoice.schemaName, fieldname);
    },
    async fetchPendingInvoices() {
      const pendingInvoices = [];
      for (const schemaName of this.invoiceSchemaNames) {
        const invoices = await fyo.db.getAll(schemaName, {
          fields: [
            'name',
            'date',
            'outstandingAmount',
            'baseGrandTotal',
            'submitted',
          ],
          filters: {
            party: this.doc.name,
            cancelled: false,
          },
          limit: 3,
          orderBy: 'created',
        });

        invoices.forEach((i) => {
          i.schemaName = schemaName;
          i.schema = fyo.schemaMap[schemaName];
        });

        pendingInvoices.push(...invoices);
      }

      this.pendingInvoices = pendingInvoices;
    },
    getStatusBadge(doc) {
      const statusColumn = getTransactionStatusColumn();
      return statusColumn.render(doc);
    },
    routeToForm(invoice) {
      routeTo(`/edit/${invoice.schemaName}/${invoice.name}`);
    },
    fullyPaid(invoice) {
      return invoice.outstandingAmount.isZero();
    },
    amountPaid(invoice) {
      return invoice.baseGrandTotal.sub(invoice.outstandingAmount);
    },
  },
};
</script>
