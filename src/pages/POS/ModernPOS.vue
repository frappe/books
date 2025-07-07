<template>
  <div>
    <OpenPOSShiftModal
      v-if="!isPosShiftOpen"
      :open-modal="!isPosShiftOpen"
      @toggle-modal="emitEvent('toggleModal', 'ShiftOpen')"
    />

    <ClosePOSShiftModal
      :open-modal="openShiftCloseModal"
      @toggle-modal="emitEvent('toggleModal', 'ShiftClose')"
    />

    <LoyaltyProgramModal
      :open-modal="openLoyaltyProgramModal"
      :loyalty-points="loyaltyPoints"
      :loyalty-program="loyaltyProgram"
      @toggle-modal="emitEvent('toggleModal', 'LoyaltyProgram')"
      @set-loyalty-points="(points) => emitEvent('setLoyaltyPoints', points)"
    />

    <SavedInvoiceModal
      :open-modal="openSavedInvoiceModal"
      :modal-status="openSavedInvoiceModal"
      @toggle-modal="emitEvent('toggleModal', 'SavedInvoice')"
      @selected-invoice-name="
        (invName) => emitEvent('selectedInvoiceName', invName)
      "
    />

    <CouponCodeModal
      :open-modal="openCouponCodeModal"
      @apply-pricing-rule="emitEvent('applyPricingRule')"
      @toggle-modal="emitEvent('toggleModal', 'CouponCode')"
      @set-coupons-count="(count) => emitEvent('setCouponsCount', count)"
    />

    <PriceListModal
      :open-modal="openPriceListModal"
      @toggle-modal="emitEvent('toggleModal', 'PriceList')"
    />

    <PaymentModal
      :open-modal="openPaymentModal"
      @toggle-modal="emitEvent('toggleModal', 'Payment')"
      @set-paid-amount="(amount) => emitEvent('setPaidAmount', amount)"
      @set-payment-method="
        (paymentMethod) => emitEvent('setPaymentMethod', paymentMethod)
      "
      @set-transfer-ref-no="(ref) => emitEvent('setTransferRefNo', ref)"
      @set-transfer-clearance-date="
        (date) => emitEvent('setTransferClearanceDate', date)
      "
      @create-transaction="
        (print, status) => emitEvent('createTransaction', print, status)
      "
    />

    <ReturnSalesInvoiceModal
      :open-modal="openReturnSalesInvoiceModal"
      :modal-status="openReturnSalesInvoiceModal"
      @selected-return-invoice="(value:any) => emitEvent('selectedReturnInvoice', value)"
      @toggle-modal="emitEvent('toggleModal', 'ReturnSalesInvoice')"
    />

    <AlertModal
      :open-modal="openAlertModal"
      @toggle-modal="emitEvent('toggleModal', 'Alert')"
      @save-and-continue="(value:any)=>emitEvent('saveAndContinue',value)"
    />

    <KeyboardModal
      v-if="selectedItemField && selectedItemRow"
      :open-modal="openKeyboardModal"
      :modal-status="openKeyboardModal"
      :selected-item-field="selectedItemField"
      :selected-item-row="(selectedItemRow as SalesInvoiceItem)"
      @toggle-modal="emitEvent('toggleModal', 'Keyboard')"
      @apply-pricing-rule="emitEvent('applyPricingRule')"
    />

    <div class="bg-gray-25 dark:bg-gray-875 grid grid-cols-9 gap-3 p-4">
      <div class="col-span-3 flex h-auto w-full">
        <div class="grid grid-rows-5 w-full gap-3">
          <div
            class="
              p-4
              grow
              h-full
              row-span-5
              bg-white
              border
              rounded-md
              dark:bg-gray-850 dark:border-gray-800
            "
          >
            <!-- Customer Search -->
            <MultiLabelLink
              v-if="sinvDoc?.fieldMap"
              class="flex-shrink-0"
              secondary-link="phone"
              :border="true"
              :value="sinvDoc?.party"
              :df="sinvDoc?.fieldMap.party"
              @change="(value:string) => $emit('setCustomer',value)"
            />

            <ModernPOSSelectedItemTable
              @selected-row="selectedRow"
              @apply-pricing-rule="emitEvent('applyPricingRule')"
              @toggle-modal="emitEvent('toggleModal', 'Keyboard')"
            />
          </div>

          <div
            class="
              h-full
              p-2
              bg-white
              border
              rounded-md
              dark:bg-gray-850 dark:border-gray-800
            "
          >
            <div class="grid grid-cols-2 gap-2">
              <FloatingLabelFloatInput
                :df="{
                  label: t`Total Quantity`,
                  fieldtype: 'Int',
                  fieldname: 'totalQuantity',
                  minvalue: 0,
                  maxvalue: 1000,
                }"
                size="large"
                :value="totalQuantity"
                :read-only="true"
                :text-right="true"
              />

              <FloatingLabelCurrencyInput
                :df="{
                  label: t`Add'l Discounts`,
                  fieldtype: 'Int',
                  fieldname: 'additionalDiscount',
                  minvalue: 0,
                }"
                size="large"
                :value="additionalDiscounts"
                :read-only="true"
                :text-right="true"
                @change="(amount:Money)=> additionalDiscounts = amount"
              />
            </div>

            <div class="mt-2 grid grid-cols-2 gap-2">
              <FloatingLabelCurrencyInput
                :df="{
                  label: t`Item Discounts`,
                  fieldtype: 'Currency',
                  fieldname: 'itemDiscounts',
                }"
                size="large"
                :value="itemDiscounts"
                :read-only="true"
                :text-right="true"
              />

              <FloatingLabelCurrencyInput
                v-if="sinvDoc?.fieldMap"
                :df="sinvDoc?.fieldMap.grandTotal"
                size="large"
                :value="sinvDoc?.grandTotal"
                :read-only="true"
                :text-right="true"
              />
            </div>

            <div class="flex w-full gap-2">
              <div class="w-full">
                <Button
                  class="mt-2 w-full py-5"
                  :style="{
                    backgroundColor:
                      profile?.saveButtonColour ||
                      fyo.singles.Defaults?.saveButtonColour,
                  }"
                  :disabled="!sinvDoc?.party || !sinvDoc?.items?.length"
                  @click="$emit('saveInvoiceAction')"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Save` }}
                    </p>
                  </slot>
                </Button>
                <Button
                  class="w-full mt-2 py-5"
                  :style="{
                    backgroundColor:
                      profile?.heldButtonColour ||
                      fyo.singles.Defaults?.heldButtonColour,
                  }"
                  @click="emitEvent('toggleModal', 'SavedInvoice', true)"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Held` }}
                    </p>
                  </slot>
                </Button>
              </div>
              <div class="w-full">
                <Button
                  class="mt-2 w-full py-5"
                  :style="{
                    backgroundColor:
                      profile?.cancelButtonColour ||
                      fyo.singles.Defaults?.cancelButtonColour,
                  }"
                  :disabled="!sinvDoc?.items?.length"
                  @click="() => $emit('clearValues')"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Cancel` }}
                    </p>
                  </slot>
                </Button>
                <Button
                  v-if="isReturnInvoiceEnabledReturn"
                  class="mt-2 w-full py-5"
                  :style="{
                    backgroundColor:
                      profile?.returnButtonColour ||
                      fyo.singles.Defaults?.returnButtonColour,
                  }"
                  @click="emitEvent('toggleModal', 'ReturnSalesInvoice', true)"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Return` }}
                    </p>
                  </slot>
                </Button>
                <Button
                  v-else
                  class="mt-2 w-full py-5"
                  :style="{
                    backgroundColor:
                      profile?.buyButtonColour ||
                      fyo.singles.Defaults?.buyButtonColour,
                  }"
                  :disabled="disablePayButton"
                  @click="emitEvent('toggleModal', 'Payment', true)"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Buy` }}
                    </p>
                  </slot>
                </Button>
              </div>
            </div>
            <Button
              v-if="isReturnInvoiceEnabledReturn"
              class="mt-2 w-full py-5"
              :style="{
                backgroundColor:
                  profile?.buyButtonColour ||
                  fyo.singles.Defaults?.buyButtonColour,
              }"
              :disabled="disablePayButton"
              @click="emitEvent('toggleModal', 'Payment', true)"
            >
              <slot>
                <p class="uppercase text-lg text-white font-semibold">
                  {{ t`Buy` }}
                </p>
              </slot>
            </Button>
          </div>
        </div>
      </div>

      <div
        class="
          bg-white
          border
          rounded-md
          col-span-6
          flex flex-col
          dark:bg-gray-850 dark:border-gray-800
        "
        style="height: calc(100vh - 6rem)"
      >
        <div class="rounded-md p-4 col-span-5">
          <div class="flex gap-x-2">
            <!-- Item Search -->
            <MultiLabelLink
              class="w-full"
              secondary-link="barcode"
              third-link="itemCode"
              :df="{
                label: t`Search Item (Name or
            Barcode)`,
                fieldtype: 'Link',
                fieldname: 'item',
                target: 'Item',
              }"
              :border="true"
              :value="itemSearchTerm"
              @keyup.enter="(item) =>
                  emitEvent('handleItemSearch', item.target.value as string, true)
              "
              @change="(item: string) => emitEvent('handleItemSearch', item)"
            />

            <Link
              v-if="fyo.singles.AccountingSettings?.enableitemGroup"
              :df="{
                label: t`Filter by Group`,
                fieldtype: 'Link',
                fieldname: 'itemGroup',
                target: 'ItemGroup',
              }"
              :border="true"
              :value="selectedItemGroup"
              @change="(group: string) => emitEvent('setItemGroup',group)"
            />
          </div>

          <ModernPOSItemsTable
            v-if="tableView"
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="(item:string) => emitEvent('addItem', item)"
          />

          <ModernPOSItemsGrid
            v-else
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="(item:string) => emitEvent('addItem', item)"
          />

          <div class="flex fixed bottom-0 p-1 ml-3 mb-7 gap-x-3">
            <POSQuickActions
              :sinv-doc="sinvDoc"
              :loyalty-points="loyaltyPoints"
              :loyalty-program="loyaltyProgram"
              :applied-coupons-count="appliedCouponsCount"
              @toggle-view="emitEvent('toggleView')"
              @emit-route-to-sinv-list="emitEvent('routeToSinvList')"
              @toggle-modal="(modalName) => emitEvent('toggleModal', modalName)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Money } from 'pesa';
import { PropType } from 'vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import { getItem } from 'src/utils/pos';
import AlertModal from './AlertModal.vue';
import PaymentModal from './PaymentModal.vue';
import Button from 'src/components/Button.vue';
import KeyboardModal from './KeyboardModal.vue';
import PriceListModal from './PriceListModal.vue';
import { Item } from 'models/baseModels/Item/Item';
import Link from 'src/components/Controls/Link.vue';
import CouponCodeModal from './CouponCodeModal.vue';
import POSQuickActions from './POSQuickActions.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import SavedInvoiceModal from './SavedInvoiceModal.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import LoyaltyProgramModal from './LoyaltyProgramModal.vue';
import ReturnSalesInvoiceModal from './ReturnSalesInvoiceModal.vue';
import { POSProfile } from 'models/baseModels/POSProfile/PosProfile';
import MultiLabelLink from 'src/components/Controls/MultiLabelLink.vue';
import { POSItem, PosEmits, ItemQtyMap } from 'src/components/POS/types';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import ModernPOSItemsGrid from 'src/components/POS/Modern/ModernPOSItemsGrid.vue';
import ModernPOSItemsTable from 'src/components/POS/Modern/ModernPOSItemsTable.vue';
import FloatingLabelFloatInput from 'src/components/POS/FloatingLabelFloatInput.vue';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import FloatingLabelCurrencyInput from 'src/components/POS/FloatingLabelCurrencyInput.vue';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import ModernPOSSelectedItemTable from 'src/components/POS/Modern/ModernPOSSelectedItemTable.vue';

export default defineComponent({
  name: 'ModernPos',
  components: {
    Link,
    Button,
    AlertModal,
    PaymentModal,
    KeyboardModal,
    MultiLabelLink,
    PriceListModal,
    POSQuickActions,
    CouponCodeModal,
    OpenPOSShiftModal,
    SavedInvoiceModal,
    ModernPOSItemsGrid,
    ClosePOSShiftModal,
    LoyaltyProgramModal,
    ModernPOSItemsTable,
    FloatingLabelFloatInput,
    ReturnSalesInvoiceModal,
    FloatingLabelCurrencyInput,
    ModernPOSSelectedItemTable,
  },
  props: {
    paidAmount: Money,
    tableView: Boolean,
    itemDiscounts: Money,
    openAlertModal: Boolean,
    isPosShiftOpen: Boolean,
    disablePayButton: Boolean,
    openPaymentModal: Boolean,
    openKeyboardModal: Boolean,
    openPriceListModal: Boolean,
    openCouponCodeModal: Boolean,
    openShiftCloseModal: Boolean,
    openSavedInvoiceModal: Boolean,
    openLoyaltyProgramModal: Boolean,
    openAppliedCouponsModal: Boolean,
    openReturnSalesInvoiceModal: Boolean,
    totalQuantity: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    itemSearchTerm: {
      type: String,
      default: '',
    },
    selectedItemGroup: {
      type: String,
      default: '',
    },
    loyaltyProgram: {
      type: String,
      default: '',
    },
    appliedCouponsCount: {
      type: Number,
      default: 0,
    },
    coupons: {
      type: Object as PropType<AppliedCouponCodes>,
      default: () => ({}),
    },
    sinvDoc: {
      type: Object as PropType<SalesInvoice | undefined>,
      default: undefined,
    },
    itemQuantityMap: {
      type: Object as PropType<ItemQtyMap>,
      default: () => ({}),
    },
    items: {
      type: Array as PropType<POSItem[] | undefined>,
      default: () => [],
    },
    profile: {
      type: Object as PropType<POSProfile>,
      required: false,
      default: null,
    },
  },
  emits: [
    'addItem',
    'toggleView',
    'toggleModal',
    'setCustomer',
    'clearValues',
    'setItemGroup',
    'setPaidAmount',
    'setCouponsCount',
    'routeToSinvList',
    'handleItemSearch',
    'setLoyaltyPoints',
    'setPaymentMethod',
    'setTransferRefNo',
    'applyPricingRule',
    'saveInvoiceAction',
    'createTransaction',
    'setTransferAmount',
    'selectedInvoiceName',
    'selectedReturnInvoice',
    'setTransferClearanceDate',
    'saveAndContinue',
  ],
  data() {
    return {
      additionalDiscounts: fyo.pesa(0),

      selectedItemField: '',
      selectedItemRow: {} as SalesInvoiceItem,

      itemGroupFilter: '',
    };
  },
  computed: {
    isReturnInvoiceEnabledReturn: () =>
      fyo.singles.AccountingSettings?.enableInvoiceReturns ?? undefined,
  },
  methods: {
    emitEvent(
      eventName: PosEmits,
      ...args: (string | boolean | Item | number | Money)[]
    ) {
      this.$emit(eventName, ...args);
    },
    selectedRow(row: SalesInvoiceItem, field: string) {
      this.selectedItemRow = row;
      this.selectedItemField = field;
    },
    getItem,
  },
});
</script>
