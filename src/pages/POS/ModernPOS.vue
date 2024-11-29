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
      @set-cash-amount="(amount) => emitEvent('setCashAmount', amount)"
      @set-transfer-ref-no="(ref) => emitEvent('setTransferRefNo', ref)"
      @set-transfer-amount="(amount) => emitEvent('setTransferAmount', amount)"
      @set-transfer-clearance-date="
        (date) => emitEvent('setTransferClearanceDate', date)
      "
      @create-transaction="
        (createTransaction) => emitEvent('createTransaction', createTransaction)
      "
    />

    <AlertModal
      :open-modal="openAlertModal"
      @toggle-modal="emitEvent('toggleModal', 'Alert')"
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
              p-4
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
                  class="mt-2 w-full bg-violet-500 dark:bg-violet-700 py-5"
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
                  class="w-full mt-2 bg-blue-500 dark:bg-blue-700 py-5"
                  @click="emitEvent('toggleModal', 'SavedInvoice', true)"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`held` }}
                    </p>
                  </slot>
                </Button>
              </div>
              <div class="w-full">
                <Button
                  class="mt-2 w-full bg-red-500 dark:bg-red-700 py-5"
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
                  class="mt-2 w-full bg-green-500 dark:bg-green-700 py-5"
                  :disabled="disablePayButton"
                  @click="emitEvent('toggleModal', 'Payment', true)"
                >
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Pay` }}
                    </p>
                  </slot>
                </Button>
              </div>
            </div>
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
        <div class="rounded-md p-4 col-span-5 h-full">
          <div class="flex gap-x-2">
            <!-- Item Search -->
            <Link
              :class="
                fyo.singles.InventorySettings?.enableBarcodes
                  ? 'flex-shrink-0 w-2/3'
                  : 'w-full'
              "
              :df="{
                label: t`Search an Item`,
                fieldtype: 'Link',
                fieldname: 'item',
                target: 'Item',
              }"
              :border="true"
              :value="itemSearchTerm"
              @keyup.enter="
                async () => emitEvent('addItem', await getItem(itemSearchTerm) as Item)
              "
              @change="(item: string) =>itemSearchTerm= item"
            />

            <Barcode
              v-if="fyo.singles.InventorySettings?.enableBarcodes"
              class="w-1/3"
              @item-selected="
                async (name: string) => {
                  emitEvent('addItem', await getItem(name) as Item);
                }
              "
            />
          </div>

          <ModernPOSItemsTable
            v-if="tableView"
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="(item) => emitEvent('addItem', item)"
          />

          <ModernPOSItemsGrid
            v-else
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="(item) => emitEvent('addItem', item)"
          />
        </div>

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
import Barcode from 'src/components/Controls/Barcode.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import LoyaltyProgramModal from './LoyaltyProgramModal.vue';
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
    Barcode,
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
    FloatingLabelCurrencyInput,
    ModernPOSSelectedItemTable,
  },
  props: {
    cashAmount: Money,
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
    totalQuantity: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
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
  },
  emits: [
    'addItem',
    'toggleView',
    'toggleModal',
    'setCustomer',
    'clearValues',
    'setCashAmount',
    'setCouponsCount',
    'routeToSinvList',
    'setLoyaltyPoints',
    'setTransferRefNo',
    'applyPricingRule',
    'saveInvoiceAction',
    'createTransaction',
    'setTransferAmount',
    'selectedInvoiceName',
    'setTransferClearanceDate',
  ],
  data() {
    return {
      additionalDiscounts: fyo.pesa(0),

      selectedItemField: '',
      selectedItemRow: {} as SalesInvoiceItem,

      itemSearchTerm: '',
    };
  },
  methods: {
    emitEvent(eventName: PosEmits, ...args: (string | boolean | Item)[]) {
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
