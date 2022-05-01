<template>
  <div class="flex flex-col" v-if="doc">
    <PageHeader :backLink="true">
      <template #actions>
        <StatusBadge :status="status" />
        <Button
          v-if="doc.submitted"
          class="text-gray-900 text-xs ml-2"
          :icon="true"
          @click="routeTo(`/print/${doc.schemaName}/${doc.name}`)"
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
          {{ t`Save` }}
        </Button>
        <Button
          v-if="!doc.dirty && !doc.notInserted && !doc.submitted"
          type="primary"
          class="text-white text-xs ml-2"
          @click="onSubmitClick"
          >{{ t`Submit` }}</Button
        >
      </template>
    </PageHeader>
    <div class="flex justify-center flex-1 mb-8 mt-2" v-if="doc">
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
                doc.notInserted
                  ? doc.schemaName === 'SalesInvoice'
                    ? t`New Sales Invoice`
                    : t`New Purchase Invoice`
                  : doc.name
              }}
            </h1>
            <div class="flex justify-between mt-2">
              <div class="w-1/3">
                <FormControl
                  class="bg-gray-100 rounded text-base"
                  input-class="p-2 text-lg font-semibold bg-transparent"
                  :df="getField('party')"
                  :value="doc.party"
                  :placeholder="getField('party').label"
                  @change="(value) => doc.set('party', value)"
                  @new-doc="(party) => doc.set('party', party.name)"
                  :read-only="doc.submitted"
                />
                <FormControl
                  class="mt-2 text-base bg-gray-100 rounded"
                  input-class="px-3 py-2 text-base bg-transparent"
                  :df="getField('account')"
                  :value="doc.account"
                  :placeholder="'Account'"
                  @change="(value) => doc.set('account', value)"
                  :read-only="doc.submitted"
                />
              </div>
              <div class="w-1/3">
                <FormControl
                  input-class="bg-gray-100 px-3 py-2 text-base text-right"
                  :df="getField('date')"
                  :value="doc.date"
                  :placeholder="'Date'"
                  @change="(value) => doc.set('date', value)"
                  :read-only="doc.submitted"
                />
                <FormControl
                  class="mt-2 text-base bg-gray-100 rounded"
                  input-class="bg-transparent px-3 py-2 text-base text-right"
                  :df="getField('numberSeries')"
                  :value="doc.numberSeries"
                  @change="(value) => doc.set('numberSeries', value)"
                  :read-only="!doc.notInserted || doc.submitted"
                />
              </div>
            </div>
          </div>
          <div class="px-6 text-base">
            <FormControl
              :df="getField('items')"
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
          v-if="doc.items?.length ?? 0"
        >
          <div class="flex-1 mr-10">
            <FormControl
              v-if="!doc.submitted || doc.terms"
              :df="getField('terms')"
              :value="doc.terms"
              :show-label="true"
              input-class="bg-gray-100"
              @change="(value) => doc.set('terms', value)"
              :read-only="doc.submitted"
            />
          </div>
          <div class="w-64">
            <div class="flex pl-2 justify-between py-3 border-b">
              <div>{{ t`Subtotal` }}</div>
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
                  fyo.format(tax.amount, {
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
              <div>{{ t`Grand Total` }}</div>
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
              <div>{{ t`Outstanding Amount` }}</div>
              <div>{{ formattedValue('outstandingAmount') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { computed } from '@vue/reactivity';
import { getInvoiceStatus } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import PageHeader from 'src/components/PageHeader.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import { fyo } from 'src/initFyo';
import {
  getActionsForDocument,
  openSettings,
  routeTo,
  showMessageDialog,
} from 'src/utils/ui';
import { handleErrorWithDialog } from '../errorHandling';

export default {
  name: 'InvoiceForm',
  props: { schemaName: String, name: String },
  components: {
    PageHeader,
    StatusBadge,
    Button,
    FormControl,
    DropdownWithActions,
  },
  provide() {
    return {
      schemaName: this.schemaName,
      name: this.name,
      doc: computed(() => this.doc),
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
    address() {
      return this.printSettings && this.printSettings.getLink('address');
    },
    showSave() {
      return this.doc && (this.doc.notInserted || this.doc.dirty);
    },
    actions() {
      return getActionsForDocument(this.doc);
    },
  },
  async mounted() {
    try {
      this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
    } catch (error) {
      if (error instanceof fyo.errors.NotFoundError) {
        routeTo(`/list/${this.schemaName}`);
        return;
      }
      this.handleError(error);
    }
    this.printSettings = await fyo.doc.getSingle('PrintSettings');
    this.companyName = (
      await fyo.doc.getSingle('AccountingSettings')
    ).companyName;

    let query = this.$route.query;
    if (query.values && query.schemaName === this.schemaName) {
      this.doc.set(this.$router.currentRoute.value.query.values);
    }
    this.status = getInvoiceStatus(this.doc);

    if (fyo.store.isDevelopment) {
      window.inv = this;
    }
  },
  updated() {
    this.status = getInvoiceStatus(this.doc);
  },
  methods: {
    routeTo,
    getField(fieldname) {
      return fyo.getField(this.schemaName, fieldname);
    },
    async onSaveClick() {
      await this.doc.set(
        'items',
        this.doc.items.filter((row) => row.item)
      );
      return this.doc.sync().catch(this.handleError);
    },
    onSubmitClick() {
      let message =
        this.schemaName === ModelNameEnum.SalesInvoice
          ? this.t`Are you sure you want to submit this Sales Invoice?`
          : this.t`Are you sure you want to submit this Purchase Invoice?`;
      showMessageDialog({
        message,
        buttons: [
          {
            label: this.t`Yes`,
            action: () => {
              this.doc.submit().catch(this.handleError);
            },
          },
          {
            label: this.t`No`,
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

      const df = this.getField(fieldname);
      return fyo.format(doc[fieldname], df, doc);
    },
  },
};
</script>
