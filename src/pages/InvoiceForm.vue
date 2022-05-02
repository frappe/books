<template>
  <div class="flex flex-col" v-if="doc">
    <!-- Page Header (Title, Buttons, etc) -->
    <PageHeader :backLink="true">
      <StatusBadge :status="status" />
      <Button
        v-if="doc?.submitted"
        class="text-gray-900 text-xs"
        :icon="true"
        @click="routeTo(`/print/${doc.schemaName}/${doc.name}`)"
      >
        {{ t`Print` }}
      </Button>
      <DropdownWithActions :actions="actions" />
      <Button
        v-if="doc?.notInserted || doc?.dirty"
        type="primary"
        class="text-white text-xs"
        @click="sync"
      >
        {{ t`Save` }}
      </Button>
      <Button
        v-if="!doc?.dirty && !doc?.notInserted && !doc?.submitted"
        type="primary"
        class="text-white text-xs"
        @click="submit"
        >{{ t`Submit` }}</Button
      >
    </PageHeader>

    <!-- Invoice Form -->
    <div class="flex justify-center flex-1 mb-8 mt-2" v-if="doc">
      <div
        class="
          border
          rounded-lg
          shadow
          h-full
          flex flex-col
          justify-between
          w-600
        "
      >
        <div>
          <!-- Print Settings Info (Logo, Address, Etc)  -->
          <div class="flex text-sm text-gray-900 p-6" v-if="printSettings">
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
          <hr />

          <!-- Invoice Form Data Entry -->
          <div class="m-6 flex flex-col gap-2">
            <h1 class="text-2xl font-semibold">
              {{
                doc.notInserted
                  ? doc.schemaName === 'SalesInvoice'
                    ? t`New Sales Invoice`
                    : t`New Purchase Invoice`
                  : doc.name
              }}
            </h1>

            <!-- First Row of Fields -->
            <div class="flex flex-row justify-between gap-2">
              <FormControl
                class="bg-gray-100 rounded text-base w-1/3"
                input-class="text-lg font-semibold bg-transparent"
                :df="getField('party')"
                :value="doc.party"
                :placeholder="getField('party').label"
                @change="(value) => doc.set('party', value)"
                @new-doc="(party) => doc.set('party', party.name)"
                :read-only="doc?.submitted"
              />
              <div class="w-1/3" />
              <FormControl
                class="w-1/3"
                input-class="bg-gray-100 px-3 py-2 text-base text-right"
                :df="getField('date')"
                :value="doc.date"
                :placeholder="'Date'"
                @change="(value) => doc.set('date', value)"
                :read-only="doc?.submitted"
              />
            </div>

            <!-- Second Row of Fields -->
            <div class="flex flex-row justify-between gap-2">
              <FormControl
                class="text-base bg-gray-100 rounded w-1/3"
                input-class="px-3 py-2 text-base bg-transparent"
                :df="getField('account')"
                :value="doc.account"
                :placeholder="'Account'"
                @change="(value) => doc.set('account', value)"
                :read-only="doc?.submitted"
              />
              <div class="w-1/3" />
              <FormControl
                class="text-base bg-gray-100 rounded w-1/3"
                input-class="bg-transparent px-3 py-2 text-base text-right"
                :df="getField('numberSeries')"
                :value="doc.numberSeries"
                @change="(value) => doc.set('numberSeries', value)"
                :read-only="!doc.notInserted || doc?.submitted"
              />
            </div>
          </div>
          <hr />

          <!-- Invoice Items Table -->
          <Table
            class="px-6 text-base mt-4"
            :df="getField('items')"
            :value="doc.items"
            :showHeader="true"
            :max-rows-before-overflow="4"
            @change="(value) => doc.set('items', value)"
            :read-only="doc?.submitted"
          />
        </div>

        <!-- Invoice Form Footer -->

        <div v-if="doc.items?.length ?? 0">
          <hr />
          <div class="flex justify-between text-base m-6 gap-12">
            <!-- Form Terms-->
            <FormControl
              class="w-1/2 self-end"
              v-if="!doc?.submitted || doc.terms"
              :df="getField('terms')"
              :value="doc.terms"
              input-class="bg-gray-100"
              @change="(value) => doc.set('terms', value)"
              :read-only="doc?.submitted"
            />

            <!-- Totals -->
            <div class="w-1/2 gap-2 flex flex-col self-end ml-auto">
              <!-- Subtotal -->
              <div class="flex justify-between">
                <div>{{ t`Subtotal` }}</div>
                <div>{{ formattedValue('netTotal') }}</div>
              </div>
              <hr />

              <!-- Taxes -->
              <div
                class="flex justify-between"
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
              <hr v-if="doc.taxes?.length" />

              <!-- Grand Total -->
              <div
                class="
                  flex
                  justify-between
                  text-green-600
                  font-semibold
                  text-base
                "
              >
                <div>{{ t`Grand Total` }}</div>
                <div>{{ formattedValue('grandTotal') }}</div>
              </div>

              <!-- Outstanding Amount -->
              <hr v-if="doc.outstandingAmount > 0" />
              <div
                v-if="doc.outstandingAmount > 0"
                class="
                  flex
                  justify-between
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
  </div>
</template>
<script>
import { computed } from '@vue/reactivity';
import { getInvoiceStatus } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import PageHeader from 'src/components/PageHeader.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import { fyo } from 'src/initFyo';
import {
getActionsForDocument,
openSettings,
routeTo,
showMessageDialog
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
    Table
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
    async sync() {
      return this.doc.sync().catch(this.handleError);
    },
    submit() {
      const message =
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
