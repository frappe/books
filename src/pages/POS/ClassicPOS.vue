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
      @set-paid-amount="(amount: Money) => emitEvent('setPaidAmount', amount)"
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
    />

    <div
      class="bg-gray-25 dark:bg-gray-875 grid grid-cols-12 gap-2 p-4"
      style="height: calc(100vh - var(--h-row-largest))"
    >
      <div
        class="
          col-span-5
          bg-white
          border
          rounded-md
          dark:border-gray-800 dark:bg-gray-850
        "
      >
        <div class="rounded-md p-4 col-span-5">
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
              v-if="
                fyo.singles.InventorySettings?.enableBarcodes &&
                !fyo.singles.POSSettings?.weightEnabledBarcode
              "
              class="w-1/3"
              @item-selected="
                async (name: string) => {
                  emitEvent('addItem', await getItem(name) as Item);
                }
              "
            />

            <WeightEnabledBarcode
              v-if="fyo.singles.POSSettings?.weightEnabledBarcode"
              class="w-1/3"
              @item-selected="
                async (name: string,qty:number) => {
                  emitEvent('addItem', await getItem(name) as Item,qty as number);
                }
              "
            />
          </div>

          <ItemsTable
            v-if="tableView"
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="(item) => emitEvent('addItem', item)"
          />

          <ItemsGrid
            v-else
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="(item) => emitEvent('addItem', item)"
          />

          <div class="flex fixed bottom-0 p-1 mb-7 gap-x-3">
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

      <div class="col-span-7">
        <div class="flex flex-col gap-3" style="height: calc(100vh - 6rem)">
          <div
            class="
              p-4
              bg-white
              border
              rounded-md
              grow
              h-full
              dark:border-gray-800 dark:bg-gray-850
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

            <SelectedItemTable
              @apply-pricing-rule="emitEvent('applyPricingRule')"
            />
          </div>

          <div
            class="
              p-3
              bg-white
              border
              rounded-md
              dark:border-gray-800 dark:bg-gray-850
            "
          >
            <div class="w-full grid grid-cols-2 gap-y-2 gap-x-3">
              <div class="flex flex-col justify-end">
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
                    @change="(amount:Money)=> additionalDiscounts= amount"
                  />
                </div>

                <div class="mt-4 grid grid-cols-2 gap-2">
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
              </div>
              <div class="w-full">
                <div class="w-full flex gap-2">
                  <Button
                    class="w-full bg-violet-500 dark:bg-violet-700 py-5"
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
                    class="w-full bg-red-500 dark:bg-red-700 py-5"
                    @click="() => $emit('clearValues')"
                  >
                    <slot>
                      <p class="uppercase text-lg text-white font-semibold">
                        {{ t`Cancel` }}
                      </p>
                    </slot>
                  </Button>
                </div>
                <div class="w-full flex mt-2 gap-2">
                  <Button
                    class="w-full bg-blue-500 dark:bg-blue-700 py-5"
                    @click="emitEvent('toggleModal', 'SavedInvoice', true)"
                  >
                    <slot>
                      <p class="uppercase text-lg text-white font-semibold">
                        {{ t`held` }}
                      </p>
                    </slot>
                  </Button>

                  <Button
                    class="w-full bg-orange-500 dark:bg-orange-700 py-5"
                    @click="
                      emitEvent('toggleModal', 'ReturnSalesInvoice', true)
                    "
                  >
                    <slot>
                      <p class="uppercase text-lg text-white font-semibold">
                        {{ t`Return` }}
                      </p>
                    </slot>
                  </Button>
                </div>
                <Button
                  class="w-full bg-green-500 mt-2 dark:bg-green-700 py-5"
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
    </div>
  </div>
</template>

<script lang="ts">
import { Money } from 'pesa';
import { fyo } from 'src/initFyo';
import { getItem } from 'src/utils/pos';
import AlertModal from './AlertModal.vue';
import PaymentModal from './PaymentModal.vue';
import Button from 'src/components/Button.vue';
import { defineComponent, PropType } from 'vue';
import PriceListModal from './PriceListModal.vue';
import { Item } from 'models/baseModels/Item/Item';
import Link from 'src/components/Controls/Link.vue';
import CouponCodeModal from './CouponCodeModal.vue';
import POSQuickActions from './POSQuickActions.vue';
import { PosEmits } from 'src/components/POS/types';
import SavedInvoiceModal from './SavedInvoiceModal.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import Barcode from 'src/components/Controls/Barcode.vue';
import LoyaltyProgramModal from './LoyaltyProgramModal.vue';
import { POSItem, ItemQtyMap } from 'src/components/POS/types';
import ItemsGrid from 'src/components/POS/Classic/ItemsGrid.vue';
import ItemsTable from 'src/components/POS/Classic/ItemsTable.vue';
import ReturnSalesInvoiceModal from './ReturnSalesInvoiceModal.vue';
import MultiLabelLink from 'src/components/Controls/MultiLabelLink.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import SelectedItemTable from 'src/components/POS/Classic/SelectedItemTable.vue';
import WeightEnabledBarcode from 'src/components/Controls/WeightEnabledBarcode.vue';
import FloatingLabelFloatInput from 'src/components/POS/FloatingLabelFloatInput.vue';
import FloatingLabelCurrencyInput from 'src/components/POS/FloatingLabelCurrencyInput.vue';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';

export default defineComponent({
  name: 'ClassicPOS',
  components: {
    Link,
    Button,
    Barcode,
    ItemsGrid,
    AlertModal,
    ItemsTable,
    PaymentModal,
    MultiLabelLink,
    PriceListModal,
    CouponCodeModal,
    POSQuickActions,
    OpenPOSShiftModal,
    SelectedItemTable,
    SavedInvoiceModal,
    ClosePOSShiftModal,
    LoyaltyProgramModal,
    WeightEnabledBarcode,
    FloatingLabelFloatInput,
    ReturnSalesInvoiceModal,
    FloatingLabelCurrencyInput,
  },
  props: {
    paidAmount: Money,
    tableView: Boolean,
    itemDiscounts: Money,
    openAlertModal: Boolean,
    isPosShiftOpen: Boolean,
    disablePayButton: Boolean,
    openPaymentModal: Boolean,
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
    loyaltyProgram: {
      type: String,
      default: '',
    },
    appliedCouponsCount: {
      type: Number,
      default: 0,
    },
    sinvDoc: {
      type: Object as PropType<SalesInvoice | undefined>,
      default: undefined,
    },
    itemQuantityMap: {
      type: Object as PropType<ItemQtyMap>,
      default: () => ({}),
    },
    coupons: {
      type: Object as PropType<AppliedCouponCodes>,
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
    'setPaidAmount',
    'setCouponsCount',
    'routeToSinvList',
    'setPaymentMethod',
    'setTransferRefNo',
    'setLoyaltyPoints',
    'applyPricingRule',
    'saveInvoiceAction',
    'createTransaction',
    'setTransferAmount',
    'selectedInvoiceName',
    'selectedReturnInvoice',
    'setTransferClearanceDate',
  ],
  data() {
    return {
      additionalDiscounts: fyo.pesa(0),
      itemSearchTerm: '',
    };
  },
  methods: {
    emitEvent(
      eventName: PosEmits,
      ...args: (string | boolean | Item | number | Money)[]
    ) {
      this.$emit(eventName, ...args);
    },
    getItem,
  },
});
</script>
