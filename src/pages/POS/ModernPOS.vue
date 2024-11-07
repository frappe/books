<template>
  <div>
    <OpenPOSShiftModal
      v-if="!isPosShiftOpen"
      :open-modal="!isPosShiftOpen"
      @toggle-modal="toggleModal"
    />

    <ClosePOSShiftModal
      :open-modal="openShiftCloseModal"
      @toggle-modal="toggleModal"
    />

    <LoyaltyProgramModal
      :open-modal="openLoyaltyProgramModal"
      :loyalty-points="loyaltyPoints"
      :loyalty-program="loyaltyProgram"
      @set-loyalty-points="emitSetLoyaltyPoints"
      @toggle-modal="toggleModal"
    />

    <SavedInvoiceModal
      :open-modal="openSavedInvoiceModal"
      :modal-status="openSavedInvoiceModal"
      @toggle-modal="toggleModal"
      @selected-invoice-name="emitSelectedInvoice"
    />

    <CouponCodeModal
      :open-modal="openCouponCodeModal"
      @toggle-modal="toggleModal"
      @set-coupons-count="emitCouponsCount"
    />

    <PaymentModal
      :open-modal="openPaymentModal"
      @toggle-modal="toggleModal"
      @set-cash-amount="emitSetCashAmount"
      @set-coupons-count="emitCouponsCount"
      @set-transfer-ref-no="setTransferRefNo"
      @create-transaction="emitCreateTransaction"
      @set-transfer-amount="emitSetTransferAmount"
      @set-transfer-clearance-date="setTransferClearanceDate"
    />

    <AlertModal :open-modal="openAlertModal" @toggle-modal="toggleModal" />

    <KeyboardModal
      v-if="selectedItemField && selectedItemRow"
      :open-modal="openKeyboardModal"
      :modal-status="openKeyboardModal"
      :selected-item-field="selectedItemField"
      :selected-item-row="(selectedItemRow as SalesInvoiceItem)"
      @toggle-modal="toggleModal"
    />

    <div class="bg-gray-25 dark:bg-gray-875 grid grid-cols-9 gap-3 p-4">
      <div class="col-span-3 flex h-auto w-full">
        <div class="grid grid-rows-5 w-full gap-3">
          <div
            class="
              bg-white
              dark:bg-gray-850
              border
              dark:border-gray-800
              grow
              row-span-5
              h-full
              p-4
              rounded-md
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
              @toggle-modal="toggleModal"
            />
          </div>

          <div
            class="
              bg-white
              dark:bg-gray-850
              border
              dark:border-gray-800
              p-4
              rounded-md
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
                  @click="toggleModal('SavedInvoice', true)"
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
                  @click="toggleModal('Payment', true)"
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
          dark:bg-gray-850
          border
          dark:border-gray-800
          col-span-6
          rounded-md
          flex flex-col
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
                async () => await selectItem(await getItem(itemSearchTerm))
              "
              @change="(item: string) =>itemSearchTerm= item"
            />

            <Barcode
              v-if="fyo.singles.InventorySettings?.enableBarcodes"
              class="w-1/3"
              @item-selected="
                async (name: string) => {
                  await selectItem(await getItem(name));
                }
              "
            />
          </div>
          <ModernPOSItemsTable
            v-if="tableView"
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="selectItem"
          />
          <ModernPOSItemsGrid
            v-else
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="selectItem"
          />
        </div>

        <div class="flex fixed bottom-0 p-1 ml-3 mb-7 gap-x-3">
          <POSQuickActions
            :sinv-doc="sinvDoc"
            :loyalty-points="loyaltyPoints"
            :loyalty-program="loyaltyProgram"
            :applied-coupons-count="appliedCouponsCount"
            @toggle-view="toggleView"
            @toggle-modal="toggleModal"
            @emit-route-to-sinv-list="emitRouteToSinvList"
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
import { routeTo } from 'src/utils/ui';
import { getItem } from 'src/utils/pos';
import AlertModal from './AlertModal.vue';
import PaymentModal from './PaymentModal.vue';
import Button from 'src/components/Button.vue';
import KeyboardModal from './KeyboardModal.vue';
import { Item } from 'models/baseModels/Item/Item';
import Link from 'src/components/Controls/Link.vue';
import CouponCodeModal from './CouponCodeModal.vue';
import POSQuickActions from './POSQuickActions.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import SavedInvoiceModal from './SavedInvoiceModal.vue';
import Barcode from 'src/components/Controls/Barcode.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import { Payment } from 'models/baseModels/Payment/Payment';
import LoyaltyProgramModal from './LoyaltyprogramModal.vue';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import MultiLabelLink from 'src/components/Controls/MultiLabelLink.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import ModernPOSItemsGrid from 'src/components/POS/Modern/ModernPOSItemsGrid.vue';
import ModernPOSItemsTable from 'src/components/POS/Modern/ModernPOSItemsTable.vue';
import FloatingLabelFloatInput from 'src/components/POS/FloatingLabelFloatInput.vue';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import FloatingLabelCurrencyInput from 'src/components/POS/FloatingLabelCurrencyInput.vue';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import ModernPOSSelectedItemTable from 'src/components/POS/Modern/ModernPOSSelectedItemTable.vue';
import {
  ItemQtyMap,
  ItemSerialNumbers,
  ModalName,
  POSItem,
} from 'src/components/POS/types';

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
    itemDiscounts: Money,
    openAlertModal: Boolean,
    disablePayButton: Boolean,
    openPaymentModal: Boolean,
    openKeyboardModal: Boolean,
    openCouponCodeModal: Boolean,
    openShiftCloseModal: Boolean,
    openSavedInvoiceModal: Boolean,
    openLoyaltyProgramModal: Boolean,
    openAppliedCouponsModal: Boolean,
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
    'toggleModal',
    'setCustomer',
    'clearValues',
    'setCashAmount',
    'setCouponsCount',
    'routeToSinvList',
    'setLoyaltyPoints',
    'saveInvoiceAction',
    'createTransaction',
    'setTransferAmount',
    'selectedInvoiceName',
  ],
  data() {
    return {
      tableView: true,

      totalQuantity: 0,
      totalTaxedAmount: fyo.pesa(0),
      additionalDiscounts: fyo.pesa(0),

      paymentDoc: {} as Payment,
      itemSerialNumbers: {} as ItemSerialNumbers,

      selectedItemField: '',
      selectedItemRow: {} as SalesInvoiceItem,

      itemSearchTerm: '',
      transferRefNo: undefined as string | undefined,
      transferClearanceDate: undefined as Date | undefined,
    };
  },
  computed: {
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
  },
  methods: {
    setTransferRefNo(ref: string) {
      this.transferRefNo = ref;
    },
    toggleView() {
      this.tableView = !this.tableView;
    },
    emitSetCashAmount(amount: Money) {
      this.$emit('setCashAmount', amount);
    },
    setTransferClearanceDate(date: Date) {
      this.transferClearanceDate = date;
    },
    emitCouponsCount(value: number) {
      this.$emit('setCouponsCount', value);
    },
    emitRouteToSinvList() {
      this.$emit('routeToSinvList');
    },
    emitSetLoyaltyPoints(value: string) {
      this.$emit('setLoyaltyPoints', value);
    },
    emitSelectedInvoice(doc: InvoiceItem) {
      this.$emit('selectedInvoiceName', doc);
    },
    toggleModal(modal: ModalName, value: boolean) {
      this.$emit('toggleModal', modal, value);
    },
    emitCreateTransaction(shouldPrint = false) {
      this.$emit('createTransaction', shouldPrint);
    },
    selectedRow(row: SalesInvoiceItem, field: string) {
      this.selectedItemRow = row;
      this.selectedItemField = field;
    },
    emitSetTransferAmount(amount: Money = fyo.pesa(0)) {
      this.$emit('setTransferAmount', amount);
    },
    selectItem(item: POSItem | Item | undefined) {
      this.$emit('addItem', item);
    },
    openCouponModal() {
      if (this.sinvDoc?.party && this.sinvDoc?.items?.length) {
        this.toggleModal('CouponCode', true);
      }
    },
    routeTo,
    getItem,
  },
});
</script>
