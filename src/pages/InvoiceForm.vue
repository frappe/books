<template>
  <div class="flex flex-col" v-if="doc">
    <PageHeader>
      <BackLink slot="title" />
      <template slot="actions">
        <StatusBadge :status="status" />
        <Button
          v-if="doc.submitted"
          class="text-gray-900 text-xs ml-2"
          :icon="true"
          @click="routeTo(`/print/${doc.doctype}/${doc.name}`)"
        >
          Print
        </Button>
        <DropdownWithActions class="ml-2" :actions="actions" />
        <Button
          v-if="showSave"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSaveClick"
        >
          {{ t('Save') }}
        </Button>
        <Button
          v-if="!doc._dirty && !doc._notInserted && !doc.submitted"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSubmitClick"
          >{{ t('Submit') }}</Button
        >
      </template>
    </PageHeader>
    <div class="flex justify-center flex-1 mb-8 mt-2" v-if="meta">
      <div
        class="border rounded-lg shadow h-full flex flex-col justify-between"
        style="width: 600px"
      >
        <div>
          <div class="px-6 pt-6" v-if="printSettings">
            <div class="flex text-sm text-gray-900 border-b pb-4">
              <div class="w-1/3">
                <div v-if="printSettings.displayLogo">
                  <img
                    class="h-12 max-w-32 object-contain"
                    :src="printSettings.logo"
                  />
                </div>
                <div class="text-xl text-gray-700 font-semibold" v-else>
                  {{ companyName }}
                </div>
              </div>
              <div class="w-1/3">
                <div>{{ printSettings.email }}</div>
                <div class="mt-1">{{ printSettings.phone }}</div>
              </div>
              <div class="w-1/3">
                <div v-if="address">{{ address.addressDisplay }}</div>
              </div>
            </div>
          </div>
          <div class="mt-8 px-6">
            <h1 class="text-2xl font-semibold">
              {{
                doc._notInserted
                  ? doc.doctype === 'SalesInvoice'
                    ? t('New Invoice')
                    : t('New Bill')
                  : doc.name
              }}
            </h1>
            <div class="flex justify-between mt-2">
              <div class="w-1/3">
                <FormControl
                  class="text-base"
                  input-class="bg-gray-100 p-2 text-lg font-semibold"
                  :df="meta.getField(partyField.fieldname)"
                  :value="doc[partyField.fieldname]"
                  :placeholder="partyField.label"
                  @change="(value) => doc.set(partyField.fieldname, value)"
                  @new-doc="
                    (party) => doc.set(partyField.fieldname, party.name)
                  "
                  :read-only="doc.submitted"
                />
                <FormControl
                  class="mt-2 text-base"
                  input-class="bg-gray-100 px-3 py-2 text-base"
                  :df="meta.getField('account')"
                  :value="doc.account"
                  :placeholder="'Account'"
                  @change="(value) => doc.set('account', value)"
                  :read-only="doc.submitted"
                />
              </div>
              <div class="w-1/3">
                <FormControl
                  input-class="bg-gray-100 px-3 py-2 text-base text-right"
                  :df="meta.getField('date')"
                  :value="doc.date"
                  :placeholder="'Date'"
                  @change="(value) => doc.set('date', value)"
                  :read-only="doc.submitted"
                />
              </div>
            </div>
          </div>
          <div class="px-6 text-base">
            <FormControl
              :df="meta.getField('items')"
              :value="doc.items"
              :showHeader="true"
              :max-rows-before-overflow="4"
              @change="(value) => doc.set('items', value)"
              :read-only="doc.submitted"
            />
          </div>
        </div>
        <div
          class="px-6 mb-6 flex justify-between text-base"
          v-if="doc.items.length"
        >
          <div class="flex-1 mr-10">
            <FormControl
              v-if="!doc.submitted || doc.terms"
              :df="meta.getField('terms')"
              :value="doc.terms"
              :show-label="true"
              input-class="bg-gray-100"
              @change="(value) => doc.set('terms', value)"
              :read-only="doc.submitted"
            />
          </div>
          <div class="w-64">
            <div class="flex pl-2 justify-between py-3 border-b">
              <div>{{ t('Subtotal') }}</div>
              <div>{{ formattedValue('netTotal') }}</div>
            </div>
            <div
              class="flex pl-2 justify-between py-3"
              v-for="tax in doc.taxes"
              :key="tax.name"
            >
              <div>{{ tax.account }}</div>
              <div>
                {{
                  frappe.format(tax.amount, {
                    fieldtype: 'Currency',
                    currency: doc.currency,
                  })
                }}
              </div>
            </div>
            <div
              class="
                flex
                pl-2
                justify-between
                py-3
                border-t
                text-green-600
                font-semibold
                text-base
              "
            >
              <div>{{ t('Grand Total') }}</div>
              <div>{{ formattedValue('grandTotal') }}</div>
            </div>
            <div
              v-if="doc.outstandingAmount > 0"
              class="
                flex
                pl-2
                justify-between
                py-3
                border-t
                text-red-600
                font-semibold
                text-base
              "
            >
              <div>{{ t('Outstanding Amount') }}</div>
              <div>{{ formattedValue('outstandingAmount') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappe';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import FormControl from '@/components/Controls/FormControl';
import DropdownWithActions from '@/components/DropdownWithActions';
import BackLink from '@/components/BackLink';
import {
  openSettings,
  getActionsForDocument,
  getInvoiceStatus,
  showMessageDialog,
  routeTo,
} from '@/utils';
import { handleErrorWithDialog } from '../errorHandling';

export default {
  name: 'InvoiceForm',
  props: ['doctype', 'name'],
  components: {
    PageHeader,
    StatusBadge,
    Button,
    FormControl,
    DropdownWithActions,
    BackLink,
  },
  provide() {
    return {
      doctype: this.doctype,
      name: this.name,
    };
  },
  data() {
    return {
      doc: null,
      status: null,
      color: null,
      printSettings: null,
      companyName: null,
    };
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    partyField() {
      let fieldname = {
        SalesInvoice: 'customer',
        PurchaseInvoice: 'supplier',
      }[this.doctype];
      return this.meta.getField(fieldname);
    },
    address() {
      return this.printSettings && this.printSettings.getLink('address');
    },
    showSave() {
      return this.doc && (this.doc._notInserted || this.doc._dirty);
    },
    actions() {
      return getActionsForDocument(this.doc);
    },
  },
  async mounted() {
    try {
      this.doc = await frappe.getDoc(this.doctype, this.name);
      window.d = this.doc;
    } catch (error) {
      if (error instanceof frappe.errors.NotFoundError) {
        routeTo(`/list/${this.doctype}`);
        return;
      }
      this.handleError(error);
    }
    this.printSettings = await frappe.getSingle('PrintSettings');
    this.companyName = (
      await frappe.getSingle('AccountingSettings')
    ).companyName;

    let query = this.$route.query;
    if (query.values && query.doctype === this.doctype) {
      this.doc.set(this.$router.currentRoute.query.values);
    }
    this.status = getInvoiceStatus(this.doc);
  },
  updated() {
    this.status = getInvoiceStatus(this.doc);
  },
  methods: {
    routeTo,
    async onSaveClick() {
      await this.doc.set(
        'items',
        this.doc.items.filter((row) => row.item)
      );
      return this.doc.insertOrUpdate().catch(this.handleError);
    },
    onSubmitClick() {
      let message =
        this.doctype === 'SalesInvoice'
          ? this.t('Are you sure you want to submit this Invoice?')
          : this.t('Are you sure you want to submit this Bill?');
      showMessageDialog({
        message,
        buttons: [
          {
            label: this.t('Yes'),
            action: () => {
              this.doc.submit().catch(this.handleError);
            },
          },
          {
            label: this.t('No'),
            action() {},
          },
        ],
      });
    },
    handleError(e) {
      handleErrorWithDialog(e, this.doc);
    },
    openInvoiceSettings() {
      openSettings('Invoice');
    },
    formattedValue(fieldname, doc) {
      if (!doc) {
        doc = this.doc;
      }
      let df = doc.meta.getField(fieldname);
      return frappe.format(doc[fieldname], df, doc);
    },
  },
};
</script>
