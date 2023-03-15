<template>
  <FormContainer>
    <!-- Page Header (Title, Buttons, etc) -->
    <template #header-left v-if="doc">
      <StatusBadge :status="status" class="h-8" />
      <Barcode
        class="h-8"
        v-if="doc.canEdit && fyo.singles.InventorySettings?.enableBarcodes"
        @item-selected="(name) => doc.addItem(name)"
      />
    </template>
    <template #header v-if="doc">
      <ExchangeRate
        v-if="doc.isMultiCurrency"
        :disabled="doc?.isSubmitted || doc?.isCancelled"
        :from-currency="fromCurrency"
        :to-currency="toCurrency"
        :exchange-rate="doc.exchangeRate"
        @change="
          async (exchangeRate) => await doc.set('exchangeRate', exchangeRate)
        "
      />
      <Button
        v-if="!doc.isCancelled && !doc.dirty"
        :icon="true"
        @click="routeTo(`/print/${doc.schemaName}/${doc.name}`)"
      >
        {{ t`Print` }}
      </Button>
      <Button
        :icon="true"
        v-if="!doc?.isSubmitted && doc.enableDiscounting"
        @click="toggleInvoiceSettings"
      >
        <feather-icon name="settings" class="w-4 h-4" />
      </Button>
      <DropdownWithActions
        v-for="group of groupedActions"
        :key="group.label"
        :type="group.type"
        :actions="group.actions"
      >
        <p v-if="group.group">
          {{ group.group }}
        </p>
        <feather-icon v-else name="more-horizontal" class="w-4 h-4" />
      </DropdownWithActions>
      <Button v-if="doc?.canSave" type="primary" @click="sync">
        {{ t`Save` }}
      </Button>
      <Button v-else-if="doc?.canSubmit" type="primary" @click="submit">{{
        t`Submit`
      }}</Button>
    </template>

    <!-- Invoice Form -->
    <template #body v-if="doc">
      <FormHeader
        :form-title="doc.notInserted ? t`New Entry` : doc.name"
        :form-sub-title="
          doc.schemaName === 'SalesInvoice'
            ? t`Sales Invoice`
            : t`Purchase Invoice`
        "
      />
      <hr />

      <div>
        <!-- Invoice Form Data Entry -->
        <div class="m-4 grid grid-cols-3 gap-4">
          <FormControl
            input-class="font-semibold"
            :border="true"
            :df="getField('party')"
            :value="doc.party"
            @change="(value) => doc.set('party', value, true)"
            @new-doc="(party) => doc.set('party', party.name, true)"
            :read-only="doc?.submitted"
          />
          <FormControl
            input-class="text-end"
            :border="true"
            :df="getField('date')"
            :value="doc.date"
            @change="(value) => doc.set('date', value)"
            :read-only="doc?.submitted"
          />
          <FormControl
            input-class="text-end"
            :border="true"
            :df="getField('numberSeries')"
            :value="doc.numberSeries"
            @change="(value) => doc.set('numberSeries', value)"
            :read-only="!doc.notInserted || doc?.submitted"
          />
          <FormControl
            :border="true"
            :df="getField('account')"
            :value="doc.account"
            @change="(value) => doc.set('account', value)"
            :read-only="doc?.submitted"
          />
          <FormControl
            v-if="doc.attachment || !(doc.isSubmitted || doc.isCancelled)"
            :border="true"
            :df="getField('attachment')"
            :value="doc.attachment"
            @change="(value) => doc.set('attachment', value)"
            :read-only="doc?.submitted"
          />
        </div>
        <hr />

        <!-- Invoice Items Table -->
        <Table
          class="text-base"
          :df="getField('items')"
          :value="doc.items"
          :showHeader="true"
          :max-rows-before-overflow="4"
          @change="(value) => doc.set('items', value)"
          @editrow="toggleQuickEditDoc"
          :read-only="doc?.submitted"
        />
      </div>

      <!-- Invoice Form Footer -->

      <div v-if="doc.items?.length ?? 0" class="mt-auto">
        <hr />
        <div class="flex justify-between text-base m-4 gap-12">
          <div class="w-1/2 flex flex-col justify-between">
            <!-- Info Note -->
            <p v-if="discountNote?.length" class="text-gray-600 text-sm">
              {{ discountNote }}
            </p>

            <p v-if="stockTransferText?.length" class="text-gray-600 text-sm">
              {{ stockTransferText }}
            </p>

            <!-- Form Terms-->
            <FormControl
              :border="true"
              v-if="!doc?.submitted || doc.terms"
              :df="getField('terms')"
              :value="doc.terms"
              class="mt-auto"
              @change="(value) => doc.set('terms', value)"
              :read-only="doc?.submitted"
            />
          </div>

          <!-- Totals -->
          <div class="w-1/2 gap-2 flex flex-col self-end ms-auto">
            <!-- Subtotal -->
            <div class="flex justify-between">
              <div>{{ t`Subtotal` }}</div>
              <div>{{ formattedValue('netTotal') }}</div>
            </div>
            <hr />

            <!-- Discount Applied Before Taxes -->
            <div
              v-if="totalDiscount.float > 0 && !doc.discountAfterTax"
              class="flex flex-col gap-2"
            >
              <div
                class="flex justify-between"
                v-if="itemDiscountAmount.float > 0"
              >
                <div>{{ t`Discount` }}</div>
                <div>
                  {{ `- ${fyo.format(itemDiscountAmount, 'Currency')}` }}
                </div>
              </div>
              <div class="flex justify-between" v-if="discountAmount.float > 0">
                <div>{{ t`Invoice Discount` }}</div>
                <div>{{ `- ${fyo.format(discountAmount, 'Currency')}` }}</div>
              </div>
              <hr v-if="doc.taxes?.length" />
            </div>

            <!-- Taxes -->
            <div
              v-if="doc.taxes?.length"
              class="flex flex-col gap-2 max-h-12 overflow-y-auto"
            >
              <div
                class="flex justify-between"
                v-for="tax in doc.taxes"
                :key="tax.name"
              >
                <div>{{ tax.account }}</div>
                <div>
                  {{
                    fyo.format(
                      tax.amount,
                      {
                        fieldtype: 'Currency',
                        fieldname: 'amount',
                      },
                      tax
                    )
                  }}
                </div>
              </div>
            </div>
            <hr v-if="doc.taxes?.length" />

            <!-- Discount Applied After Taxes -->
            <div
              v-if="totalDiscount.float > 0 && doc.discountAfterTax"
              class="flex flex-col gap-2"
            >
              <div
                class="flex justify-between"
                v-if="itemDiscountAmount.float > 0"
              >
                <div>{{ t`Discount` }}</div>
                <div>
                  {{ `- ${fyo.format(itemDiscountAmount, 'Currency')}` }}
                </div>
              </div>
              <div class="flex justify-between" v-if="discountAmount.float > 0">
                <div>{{ t`Invoice Discount` }}</div>
                <div>{{ `- ${fyo.format(discountAmount, 'Currency')}` }}</div>
              </div>
              <hr />
            </div>

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

            <!-- Base Grand Total -->
            <div
              v-if="doc.isMultiCurrency"
              class="
                flex
                justify-between
                text-green-600
                font-semibold
                text-base
              "
            >
              <div>{{ t`Base Grand Total` }}</div>
              <div>{{ formattedValue('baseGrandTotal') }}</div>
            </div>

            <!-- Outstanding Amount -->
            <hr v-if="doc.outstandingAmount?.float > 0" />
            <div
              v-if="doc.outstandingAmount?.float > 0"
              class="flex justify-between text-red-600 font-semibold text-base"
            >
              <div>{{ t`Outstanding Amount` }}</div>
              <div>{{ formattedValue('outstandingAmount') }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #quickedit>
      <Transition name="quickedit">
        <QuickEditForm
          v-if="quickEditDoc && !linked"
          :name="quickEditDoc.name"
          :show-name="false"
          :show-save="false"
          :source-doc="quickEditDoc"
          :source-fields="quickEditFields"
          :schema-name="quickEditDoc.schemaName"
          :white="true"
          :route-back="false"
          :load-on-close="false"
          @close="toggleQuickEditDoc(null)"
        />
      </Transition>

      <Transition name="quickedit">
        <LinkedEntryWidget
          v-if="linked && !quickEditDoc"
          :linked="linked"
          @close-widget="linked = null"
        />
      </Transition>
    </template>
  </FormContainer>
</template>
<script>
import { computed } from '@vue/reactivity';
import { getDocStatus } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import Barcode from 'src/components/Controls/Barcode.vue';
import ExchangeRate from 'src/components/Controls/ExchangeRate.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FormContainer from 'src/components/FormContainer.vue';
import FormHeader from 'src/components/FormHeader.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import LinkedEntryWidget from 'src/components/Widgets/LinkedEntryWidget.vue';
import { fyo } from 'src/initFyo';
import { docsPathMap } from 'src/utils/misc';
import { docsPathRef, focusedDocsRef } from 'src/utils/refs';
import {
  commonDocSync,
  commonDocSubmit,
  getGroupedActionsForDoc,
  routeTo,
} from 'src/utils/ui';
import { nextTick } from 'vue';
import { handleErrorWithDialog } from '../errorHandling';
import QuickEditForm from './QuickEditForm.vue';

export default {
  name: 'InvoiceForm',
  props: { schemaName: String, name: String },
  components: {
    StatusBadge,
    Button,
    FormControl,
    DropdownWithActions,
    Table,
    FormContainer,
    QuickEditForm,
    ExchangeRate,
    FormHeader,
    LinkedEntryWidget,
    Barcode,
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
      chstatus: false,
      doc: null,
      quickEditDoc: null,
      quickEditFields: [],
      color: null,
      printSettings: null,
      companyName: null,
      linked: null,
    };
  },
  updated() {
    this.chstatus = !this.chstatus;
  },
  computed: {
    stockTransferText() {
      if (!this.fyo.singles.AccountingSettings.enableInventory) {
        return '';
      }

      if (!this.doc.submitted) {
        return '';
      }

      const totalQuantity = this.doc.getTotalQuantity();
      const stockNotTransferred = this.doc.stockNotTransferred;

      if (stockNotTransferred === 0) {
        return this.t`Stock has been transferred`;
      }

      const stn = this.fyo.format(stockNotTransferred, 'Float');
      const tq = this.fyo.format(totalQuantity, 'Float');

      return this.t`Stock qty. ${stn} out of ${tq} left to transfer`;
    },
    groupedActions() {
      const actions = getGroupedActionsForDoc(this.doc);
      const group = this.t`View`;
      const viewgroup = actions.find((f) => f.group === group);

      if (viewgroup && this.doc?.hasLinkedPayments) {
        viewgroup.actions.push({
          label: this.t`Payments`,
          group,
          condition: (doc) => doc.hasLinkedPayments,
          action: async () => this.setlinked(ModelNameEnum.Payment),
        });
      }

      if (viewgroup && this.doc?.hasLinkedTransfers) {
        const label = this.doc.isSales
          ? this.t`Shipments`
          : this.t`Purchase Receipts`;

        viewgroup.actions.push({
          label,
          group,
          condition: (doc) => doc.hasLinkedTransfers,
          action: async () => this.setlinked(this.doc.stockTransferSchemaName),
        });
      }

      return actions;
    },
    address() {
      return this.printSettings && this.printSettings.getLink('address');
    },
    status() {
      this.chstatus;
      return getDocStatus(this.doc);
    },
    discountNote() {
      const zeroInvoiceDiscount = this.doc?.discountAmount?.isZero();
      const zeroItemDiscount = this.itemDiscountAmount?.isZero();

      if (zeroInvoiceDiscount && zeroItemDiscount) {
        return '';
      }

      if (!this.doc?.taxes?.length) {
        return '';
      }

      let text = this.t`Discount applied before taxation`;
      if (this.doc.discountAfterTax) {
        text = this.t`Discount applied after taxation`;
      }

      return text;
    },
    totalDiscount() {
      return this.discountAmount.add(this.itemDiscountAmount);
    },
    discountAmount() {
      return this.doc?.getInvoiceDiscountAmount();
    },
    itemDiscountAmount() {
      return this.doc.getItemDiscountAmount();
    },
    fromCurrency() {
      return this.doc?.currency ?? this.toCurrency;
    },
    toCurrency() {
      return fyo.singles.SystemSettings.currency;
    },
  },
  activated() {
    docsPathRef.value = docsPathMap[this.schemaName];
    focusedDocsRef.add(this.doc);
  },
  deactivated() {
    docsPathRef.value = '';
    focusedDocsRef.delete(this.doc);
  },
  async mounted() {
    try {
      this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
      focusedDocsRef.add(this.doc);
    } catch (error) {
      if (error instanceof fyo.errors.NotFoundError) {
        routeTo(`/list/${this.schemaName}`);
        return;
      }
      await this.handleError(error);
    }
    this.printSettings = await fyo.doc.getDoc('PrintSettings');
    this.companyName = (await fyo.doc.getDoc('AccountingSettings')).companyName;

    let query = this.$route.query;
    if (query.values && query.schemaName === this.schemaName) {
      this.doc.set(this.$router.currentRoute.value.query.values);
    }

    if (fyo.store.isDevelopment) {
      window.inv = this;
    }
  },
  methods: {
    routeTo,
    async setlinked(schemaName) {
      let entries = [];
      let title = '';

      if (schemaName === ModelNameEnum.Payment) {
        title = this.t`Payments`;
        entries = await this.doc.getLinkedPayments();
      } else {
        title = this.doc.isSales
          ? this.t`Shipments`
          : this.t`Purchase Receipts`;
        entries = await this.doc.getLinkedStockTransfers();
      }

      if (this.quickEditDoc) {
        this.toggleQuickEditDoc(null);
      }

      this.linked = { entries, schemaName, title };
    },
    toggleInvoiceSettings() {
      if (!this.schemaName) {
        return;
      }

      const fields = ['discountAfterTax'].map((fn) =>
        fyo.getField(this.schemaName, fn)
      );

      this.toggleQuickEditDoc(this.doc, fields);
    },
    async toggleQuickEditDoc(doc, fields = []) {
      if (this.quickEditDoc && doc) {
        this.quickEditDoc = null;
        this.quickEditFields = [];
        await nextTick();
      }

      this.quickEditDoc = doc;
      if (
        doc?.schemaName?.includes('InvoiceItem') &&
        doc?.stockNotTransferred
      ) {
        fields = [...doc.schema.quickEditFields, 'stockNotTransferred'].map(
          (f) => fyo.getField(doc.schemaName, f)
        );
      }

      this.quickEditFields = fields;
    },
    getField(fieldname) {
      return fyo.getField(this.schemaName, fieldname);
    },
    async sync() {
      await commonDocSync(this.doc);
    },
    async submit() {
      await commonDocSubmit(this.doc);
    },
    async handleError(e) {
      await handleErrorWithDialog(e, this.doc);
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
