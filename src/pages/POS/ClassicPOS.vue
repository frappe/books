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
      @selected-invoice-name="emitSelectedInvoice"
      @toggle-modal="toggleModal"
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
      @set-transfer-amount="emitSetTransferAmount"
      @create-transaction="emitCreateTransaction"
      @set-transfer-clearance-date="setTransferClearanceDate"
    />

    <AlertModal :open-modal="openAlertModal" @toggle-modal="toggleModal" />

    <div
      class="bg-gray-25 dark:bg-gray-875 gap-2 grid grid-cols-12 p-4"
      style="height: calc(100vh - var(--h-row-largest))"
    >
      <div
        class="
          bg-white
          dark:bg-gray-850
          border
          dark:border-gray-800
          col-span-5
          rounded-md
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

          <ItemsTable
            v-if="tableView"
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="selectItem"
          />

          <ItemsGrid
            v-else
            :items="items"
            :item-qty-map="itemQuantityMap as ItemQtyMap"
            @add-item="selectItem"
          />

          <div class="flex fixed bottom-0 p-1 mb-7 gap-x-3">
            <POSQuickActions />
          </div>
        </div>
      </div>

      <div class="col-span-7">
        <div class="flex flex-col gap-3" style="height: calc(100vh - 6rem)">
          <div
            class="
              bg-white
              dark:bg-gray-850
              border
              dark:border-gray-800
              grow
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

            <SelectedItemTable />
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
            <div class="w-full grid grid-cols-2 gap-y-2 gap-x-3">
              <div class="">
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
              <div class="flex w-full gap-2">
                <div class="w-full">
                  <Button
                    class="w-full bg-violet-500 dark:bg-violet-700 py-6"
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
                    class="w-full mt-4 bg-blue-500 dark:bg-blue-700 py-6"
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
                    class="w-full bg-red-500 dark:bg-red-700 py-6"
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
                    class="mt-4 w-full bg-green-500 dark:bg-green-700 py-6"
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Money } from 'pesa';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import { getItem } from 'src/utils/pos';
import AlertModal from './AlertModal.vue';
import PaymentModal from './PaymentModal.vue';
import Button from 'src/components/Button.vue';
import { defineComponent, PropType } from 'vue';
import { Item } from 'models/baseModels/Item/Item';
import Link from 'src/components/Controls/Link.vue';
import CouponCodeModal from './CouponCodeModal.vue';
import POSQuickActions from './POSQuickActions.vue';
import { ModalName } from 'src/components/POS/types';
import SavedInvoiceModal from './SavedInvoiceModal.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import Barcode from 'src/components/Controls/Barcode.vue';
import { Payment } from 'models/baseModels/Payment/Payment';
import LoyaltyProgramModal from './LoyaltyprogramModal.vue';
import ItemsGrid from 'src/components/POS/Classic/ItemsGrid.vue';
import ItemsTable from 'src/components/POS/Classic/ItemsTable.vue';
import MultiLabelLink from 'src/components/Controls/MultiLabelLink.vue';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import SelectedItemTable from 'src/components/POS/Classic/SelectedItemTable.vue';
import FloatingLabelFloatInput from 'src/components/POS/FloatingLabelFloatInput.vue';
import FloatingLabelCurrencyInput from 'src/components/POS/FloatingLabelCurrencyInput.vue';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import {
  ItemQtyMap,
  ItemSerialNumbers,
  POSItem,
} from 'src/components/POS/types';

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
    CouponCodeModal,
    POSQuickActions,
    OpenPOSShiftModal,
    SavedInvoiceModal,
    SelectedItemTable,
    ClosePOSShiftModal,
    LoyaltyProgramModal,
    FloatingLabelFloatInput,
    FloatingLabelCurrencyInput,
  },
  props: {
    cashAmount: Money,
    itemDiscounts: Money,
    openAlertModal: Boolean,
    disablePayButton: Boolean,
    openPaymentModal: Boolean,
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
