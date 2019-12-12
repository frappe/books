<template>
  <div class="flex flex-col" v-if="doc">
    <PageHeader>
      <BackLink slot="title" @click="routeToList" />
      <template slot="actions">
        <Button class="text-gray-900 text-xs" @click="openInvoiceSettings">
          {{ _('Customise') }}
        </Button>
        <Button
          v-if="doc.submitted"
          class="text-gray-900 text-xs ml-2"
          :icon="true"
          @click="$router.push(`/print/${doc.doctype}/${doc.name}`)"
        >
          <feather-icon name="printer" class="w-4 h-4" />
        </Button>
        <Dropdown
          v-if="actions && actions.length"
          class="text-xs"
          :items="actions"
          right
        >
          <template v-slot="{ toggleDropdown }">
            <Button
              class="text-gray-900 text-xs ml-2"
              :icon="true"
              @click="toggleDropdown()"
            >
              <feather-icon name="more-horizontal" class="w-4 h-4" />
            </Button>
          </template>
        </Dropdown>
        <Button
          v-if="showSave"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSaveClick"
        >
          {{ _('Save') }}
        </Button>
        <Button
          v-if="!doc._dirty && !doc._notInserted && !doc.submitted"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSubmitClick"
          >{{ _('Submit') }}</Button
        >
      </template>
    </PageHeader>
    <div
      class="flex justify-center flex-1 mb-8 mt-6"
      v-if="meta"
      :class="doc.submitted && 'pointer-events-none'"
    >
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
                    ? _('New Invoice')
                    : _('New Bill')
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
                  @change="value => doc.set(partyField.fieldname, value)"
                  @new-doc="party => doc.set(partyField.fieldname, party.name)"
                  :read-only="doc.submitted"
                />
                <FormControl
                  class="mt-2 text-base"
                  input-class="bg-gray-100 px-3 py-2 text-base"
                  :df="meta.getField('account')"
                  :value="doc.account"
                  :placeholder="'Account'"
                  @change="value => doc.set('account', value)"
                  :read-only="doc.submitted"
                />
              </div>
              <div class="w-1/3">
                <FormControl
                  input-class="bg-gray-100 px-3 py-2 text-base text-right"
                  :df="meta.getField('date')"
                  :value="doc.date"
                  :placeholder="'Date'"
                  @change="value => doc.set('date', value)"
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
              @change="value => doc.set('items', value)"
              :read-only="doc.submitted"
            />
          </div>
        </div>
        <div class="px-6 mb-6 flex justify-end text-base">
          <div class="w-64">
            <div class="flex pl-2 justify-between py-3 border-b">
              <div>{{ _('Subtotal') }}</div>
              <div>{{ formattedValue('netTotal') }}</div>
            </div>
            <div
              class="flex pl-2 justify-between py-3"
              v-for="tax in doc.taxes"
              :key="tax.name"
            >
              <div>{{ tax.account }} ({{ tax.rate }}%)</div>
              <div>
                {{
                  frappe.format(tax.amount, {
                    fieldtype: 'Currency',
                    currency: doc.currency
                  })
                }}
              </div>
            </div>
            <div
              class="flex pl-2 justify-between py-3 border-t text-green-600 font-semibold text-base"
            >
              <div>{{ _('Grand Total') }}</div>
              <div>{{ formattedValue('grandTotal') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import FormControl from '@/components/Controls/FormControl';
import Dropdown from '@/components/Dropdown';
import BackLink from '@/components/BackLink';
import { openSettings } from '@/pages/Settings/utils';
import { deleteDocWithPrompt, handleErrorWithDialog } from '@/utils';

export default {
  name: 'InvoiceForm',
  props: ['doctype', 'name'],
  components: {
    PageHeader,
    Button,
    FormControl,
    Dropdown,
    BackLink
  },
  provide() {
    return {
      doctype: this.doctype,
      name: this.name
    };
  },
  data() {
    return {
      doc: null,
      printSettings: null,
      companyName: null
    };
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    itemsMeta() {
      return frappe.getMeta(`${this.doctype}Item`);
    },
    itemTableFields() {
      return this.itemsMeta.tableFields.map(fieldname =>
        this.itemsMeta.getField(fieldname)
      );
    },
    itemTableColumnRatio() {
      return [0.3].concat(this.itemTableFields.map(() => 1));
    },
    partyField() {
      let fieldname = {
        SalesInvoice: 'customer',
        PurchaseInvoice: 'supplier'
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
      if (!this.doc) return null;
      let deleteAction = {
        component: {
          template: `<span class="text-red-700">{{ _('Delete') }}</span>`
        },
        condition: doc => !doc.isNew() && !doc.submitted,
        action: this.deleteAction
      };
      let actions = [...(this.meta.actions || []), deleteAction]
        .filter(d => (d.condition ? d.condition(this.doc) : true))
        .map(d => {
          return {
            label: d.label,
            component: d.component,
            action: d.action.bind(this, this.doc, this.$router)
          };
        });

      return actions;
    }
  },
  async mounted() {
    try {
      this.doc = await frappe.getDoc(this.doctype, this.name);
      window.d = this.doc;
    } catch (error) {
      if (error instanceof frappe.errors.NotFoundError) {
        this.routeToList();
        return;
      }
      throw error;
    }
    this.printSettings = await frappe.getSingle('PrintSettings');
    this.companyName = (
      await frappe.getSingle('AccountingSettings')
    ).companyName;

    let query = this.$route.query;
    if (query.values && query.doctype === this.doctype) {
      this.doc.set(this.$router.currentRoute.query.values);
    }
  },
  methods: {
    async addNewItem() {
      this.doc.append('items');
    },
    async onSaveClick() {
      await this.doc.set(
        'items',
        this.doc.items.filter(row => row.item)
      );
      return this.doc.insertOrUpdate().catch(this.handleError);
    },
    deleteAction() {
      return deleteDocWithPrompt(this.doc).then(res => {
        if (res) {
          this.routeToList();
        }
      });
    },
    onSubmitClick() {
      return this.doc.submit().catch(this.handleError);
    },
    handleError(e) {
      handleErrorWithDialog(e, this.doc);
    },
    openInvoiceSettings() {
      openSettings('Invoice');
    },
    routeToList() {
      this.$router.push(`/list/${this.doctype}`);
    },
    formattedValue(fieldname, doc) {
      if (!doc) {
        doc = this.doc;
      }
      let df = doc.meta.getField(fieldname);
      return frappe.format(doc[fieldname], df, doc);
    }
  }
};
</script>
