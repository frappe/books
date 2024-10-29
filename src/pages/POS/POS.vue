<template>
  <div class="">
    <PageHeader :title="t`Point of Sale`">
      <slot>
        <Button
          class="bg-red-500 dark:bg-red-700"
          @click="toggleModal('ShiftClose')"
        >
          <span class="font-medium text-white">{{ t`Close POS Shift ` }}</span>
        </Button>
      </slot>
    </PageHeader>

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
      @set-loyalty-points="setLoyaltyPoints"
      @toggle-modal="toggleModal"
    />
    <SavedInvoiceModal
      :open-modal="openSavedInvoiceModal"
      :modal-status="openSavedInvoiceModal"
      @selected-invoice-name="selectedInvoiceName"
      @toggle-modal="toggleModal"
    />

    <CouponCodeModal
      :open-modal="openCouponCodeModal"
      @set-coupons-count="setCouponsCount"
      @toggle-modal="toggleModal"
    />

    <PaymentModal
      :open-modal="openPaymentModal"
      @create-transaction="createTransaction"
      @toggle-modal="toggleModal"
      @set-cash-amount="setCashAmount"
      @set-transfer-amount="setTransferAmount"
      @set-transfer-ref-no="setTransferRefNo"
      @set-coupons-count="setCouponsCount"
      @set-transfer-clearance-date="setTransferClearanceDate"
    />

    <AlertModal
      :open-modal="openRouteToInvoiceListModal"
      @toggle-modal="toggleModal"
    />

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
                async () => await addItem(await getItem(itemSearchTerm))
              "
              @change="(item: string) =>itemSearchTerm= item"
            />

            <Barcode
              v-if="fyo.singles.InventorySettings?.enableBarcodes"
              class="w-1/3"
              @item-selected="
                async (name: string) => {
                  await addItem(await getItem(name));
                }
              "
            />
          </div>

          <ItemsTable
            v-if="tableView"
            :items="items"
            :item-qty-map="itemQtyMap"
            @add-item="addItem"
          />

          <ItemsGrid
            v-else
            :items="items"
            :item-qty-map="itemQtyMap"
            @add-item="addItem"
          />

          <div class="flex fixed bottom-0 p-1 mb-7 gap-x-3">
            <div class="relative group">
              <div class="bg-gray-100 p-1.5 rounded-md" @click="toggleView">
                <FeatherIcon
                  :name="tableView ? 'grid' : 'list'"
                  class="w-5 h-5 text-black"
                />
              </div>
              <span
                class="
                  absolute
                  bottom-full
                  left-1/2
                  transform
                  -translate-x-1/2
                  mb-2
                  bg-gray-100
                  dark:bg-gray-800 dark:text-white
                  text-black text-xs
                  rounded-md
                  p-2
                  w-20
                  text-center
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-300
                "
              >
                {{ tableView ? 'Grid View' : 'List View' }}
              </span>
            </div>

            <div class="relative group">
              <div
                class="px-1.5 py-1 rounded-md bg-gray-100"
                @click="routeToSinvList"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 -960 960 960"
                  width="21"
                  fill="#000"
                >
                  <path
                    d="M240-100q-41.92 0-70.96-29.04Q140-158.08 140-199.82V-300h120v-552.31l55.39 47.7 56.15-47.7 56.15 47.7 56.16-47.7 56.15 47.7 56.15-47.7 56.16 47.7 56.15-47.7 56.15 47.7 55.39-47.7V-200q0 41.92-29.04 70.96Q761.92-100 720-100H240Zm480-60q17 0 28.5-11.5T760-200v-560H320v460h360v100q0 17 11.5 28.5T720-160ZM367.69-610v-60h226.92v60H367.69Zm0 120v-60h226.92v60H367.69Zm310-114.62q-14.69 0-25.04-10.34-10.34-10.35-10.34-25.04t10.34-25.04q10.35-10.34 25.04-10.34t25.04 10.34q10.35 10.35 10.35 25.04t-10.35 25.04q-10.35 10.34-25.04 10.34Zm0 120q-14.69 0-25.04-10.34-10.34-10.35-10.34-25.04t10.34-25.04q10.35-10.34 25.04-10.34t25.04 10.34q10.35 10.35 10.35 25.04t-10.35 25.04q-10.35 10.34-25.04 10.34ZM240-160h380v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z"
                  />
                </svg>
              </div>

              <span
                class="
                  absolute
                  bottom-full
                  left-1/2
                  transform
                  -translate-x-1/2
                  rounded-md
                  opacity-0
                  bg-gray-100
                  dark:bg-gray-800 dark:text-white
                  text-black text-xs text-center
                  mb-2
                  p-2
                  w-28
                  group-hover:opacity-100
                  transition-opacity
                  duration-300
                "
              >
                Sales Invoice List
              </span>
            </div>

            <div class="relative group">
              <div
                class="p-1 rounded-md bg-gray-100"
                :class="{
                  hidden: !fyo.singles.AccountingSettings?.enableLoyaltyProgram,
                  'bg-gray-100': loyaltyPoints,
                  'dark:bg-gray-600 cursor-not-allowed':
                    !loyaltyPoints || !sinvDoc.party || !sinvDoc.items?.length,
                }"
                @click="
                  loyaltyPoints && sinvDoc.party && sinvDoc.items?.length
                    ? toggleModal('LoyaltyProgram', true)
                    : null
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="23px"
                  viewBox="0 -960 960 960"
                  width="25px"
                  fill="#000"
                >
                  <path
                    d="M100-180v-600h760v600H100Zm50.26-50.26h659.48v-499.48H150.26v499.48Zm0 0v-499.48 499.48Zm181.64-56.77h50.25v-42.56h48.67q14.37 0 23.6-10.38 9.22-10.38 9.22-24.25v-106.93q0-14.71-9.22-24.88-9.23-10.17-23.6-10.17H298.77v-73.95h164.87v-50.26h-81.49v-42.56H331.9v42.56h-48.41q-14.63 0-24.8 10.38-10.18 10.38-10.18 25v106.27q0 14.62 10.18 23.71 10.17 9.1 24.8 9.1h129.9v76.1H248.51v50.26h83.39v42.56Zm312.97-27.94L705.9-376H583.85l61.02 61.03ZM583.85-574H705.9l-61.03-61.03L583.85-574Z"
                  />
                </svg>
              </div>

              <span
                class="
                  absolute
                  bottom-full
                  left-1/2
                  transform
                  -translate-x-1/2
                  mb-2
                  bg-gray-100
                  dark:bg-gray-800 dark:text-white
                  text-black text-xs
                  rounded-md
                  p-2
                  w-28
                  text-center
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-300
                "
              >
                Loyalty Program
              </span>
            </div>

            <div class="relative group">
              <div
                class="p-0.5 rounded-md bg-gray-100"
                :class="{
                  hidden: !fyo.singles.AccountingSettings?.enableCouponCode,
                  'bg-gray-100': loyaltyPoints,
                  'dark:bg-gray-600 cursor-not-allowed':
                    !sinvDoc.party || !sinvDoc.items?.length,
                }"
                @click="openCouponModal()"
              >
                <svg
                  fill="#000000"
                  width="28px"
                  height="28px"
                  viewBox="0 0 512.00 512.00"
                  enable-background="new 0 0 512 512"
                  version="1.1"
                  xml:space="preserve"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  stroke="#000000"
                  stroke-width="3.312000000000001"
                  transform="matrix(1, 0, 0, 1, 0, 0)rotate(0)"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke="#CCCCCC"
                    stroke-width="19.456"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <g id="Layer_1"></g>
                    <g id="Layer_2">
                      <g>
                        <path
                          d="M412.7,134.4H229.6c-2,0-3.9,0.8-5.3,2.2l-27.8,27.8L169.1,137c-1.4-1.4-3.3-2.2-5.3-2.2H99.3c-4.1,0-7.5,3.4-7.5,7.5 v227.4c0,4.1,3.4,7.5,7.5,7.5h64.5c2,0,3.9-0.8,5.3-2.2l27.4-27.4l27.8,27.8c1.4,1.4,3.3,2.2,5.3,2.2h183.1c4.1,0,7.5-3.4,7.5-7.5 V141.9C420.2,137.7,416.8,134.4,412.7,134.4z M405.2,362.6H232.7l-30.9-30.9c-2.9-2.9-7.7-2.9-10.6,0l-30.5,30.5h-53.9V149.8h53.9 l30.5,30.5c2.9,2.9,7.7,2.9,10.6,0l30.9-30.9h172.5V362.6z"
                        ></path>
                        <path
                          d="M276.9,235.2c15.4,0,28-12.6,28-28s-12.6-28-28-28s-28,12.6-28,28S261.4,235.2,276.9,235.2z M276.9,194.2 c7.2,0,13,5.8,13,13s-5.8,13-13,13s-13-5.8-13-13S269.7,194.2,276.9,194.2z"
                        ></path>
                        <path
                          d="M360,262.4c-15.4,0-28,12.6-28,28s12.6,28,28,28s28-12.6,28-28S375.4,262.4,360,262.4z M360,303.4c-7.2,0-13-5.8-13-13 s5.8-13,13-13s13,5.8,13,13S367.2,303.4,360,303.4z"
                        ></path>
                        <path
                          d="M256.6,310.7c1.5,1.5,3.4,2.2,5.3,2.2s3.8-0.7,5.3-2.2l113.1-113.1c2.9-2.9,2.9-7.7,0-10.6c-2.9-2.9-7.7-2.9-10.6,0 L256.6,300.1C253.6,303,253.6,307.7,256.6,310.7z"
                        ></path>
                        <path
                          d="M196.5,202.5c-2,0-3.9,0.8-5.3,2.2c-1.4,1.4-2.2,3.3-2.2,5.3c0,2,0.8,3.9,2.2,5.3c1.4,1.4,3.3,2.2,5.3,2.2 c2,0,3.9-0.8,5.3-2.2c1.4-1.4,2.2-3.3,2.2-5.3c0-2-0.8-3.9-2.2-5.3C200.4,203.3,198.4,202.5,196.5,202.5z"
                        ></path>
                        <path
                          d="M196.5,233.2c-2,0-3.9,0.8-5.3,2.2c-1.4,1.4-2.2,3.3-2.2,5.3c0,2,0.8,3.9,2.2,5.3c1.4,1.4,3.3,2.2,5.3,2.2 c2,0,3.9-0.8,5.3-2.2c1.4-1.4,2.2-3.3,2.2-5.3c0-2-0.8-3.9-2.2-5.3C200.4,234,198.4,233.2,196.5,233.2z"
                        ></path>
                        <path
                          d="M196.5,263.8c-2,0-3.9,0.8-5.3,2.2c-1.4,1.4-2.2,3.3-2.2,5.3c0,2,0.8,3.9,2.2,5.3c1.4,1.4,3.3,2.2,5.3,2.2 c2,0,3.9-0.8,5.3-2.2c1.4-1.4,2.2-3.3,2.2-5.3c0-2-0.8-3.9-2.2-5.3C200.4,264.6,198.4,263.8,196.5,263.8z"
                        ></path>
                        <path
                          d="M196.5,294.5c-2,0-3.9,0.8-5.3,2.2c-1.4,1.4-2.2,3.3-2.2,5.3c0,2,0.8,3.9,2.2,5.3c1.4,1.4,3.3,2.2,5.3,2.2 c2,0,3.9-0.8,5.3-2.2c1.4-1.4,2.2-3.3,2.2-5.3c0-2-0.8-3.9-2.2-5.3C200.4,295.3,198.4,294.5,196.5,294.5z"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
              </div>
              <span
                class="
                  absolute
                  bottom-full
                  left-1/2
                  transform
                  -translate-x-1/2
                  mb-2
                  bg-gray-100
                  dark:bg-gray-800 dark:text-white
                  text-black text-xs
                  rounded-md
                  p-2
                  w-28
                  text-center
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-300
                "
              >
                Coupon Code
              </span>
              <div
                v-if="appliedCouponsCount !== 0"
                class="
                  absolute
                  top-0
                  right-0
                  transform
                  translate-x-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  bg-green-400
                  text-green-900
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-xs
                  cursor-pointer
                  border-red-500
                  p-2
                "
              >
                {{ appliedCouponsCount }}
              </div>
            </div>
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
              v-if="sinvDoc.fieldMap"
              class="flex-shrink-0"
              secondary-link="phone"
              :border="true"
              :value="sinvDoc.party"
              :df="sinvDoc.fieldMap.party"
              @change="(value:string) => setCustomer(value)"
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
                    v-if="sinvDoc.fieldMap"
                    :df="sinvDoc.fieldMap.grandTotal"
                    size="large"
                    :value="sinvDoc.grandTotal"
                    :read-only="true"
                    :text-right="true"
                  />
                </div>
              </div>
              <div class="flex w-full gap-2">
                <div class="w-full">
                  <Button
                    class="w-full bg-violet-500 dark:bg-violet-700 py-6"
                    :disabled="!sinvDoc.party || !sinvDoc.items?.length"
                    @click="handleSaveInvoiceAction"
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
                    :disabled="!sinvDoc.items?.length"
                    @click="clearValues"
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
import Button from 'src/components/Button.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import FloatingLabelCurrencyInput from 'src/components/POS/FloatingLabelCurrencyInput.vue';
import FloatingLabelFloatInput from 'src/components/POS/FloatingLabelFloatInput.vue';
import ItemsTable from 'src/components/POS/ItemsTable.vue';
import Link from 'src/components/Controls/Link.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import PaymentModal from './PaymentModal.vue';
import SelectedItemTable from 'src/components/POS/SelectedItemTable.vue';
import { computed, defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import ItemsGrid from 'src/components/POS/ItemsGrid.vue';
import { t } from 'fyo';
import {
  ItemQtyMap,
  ItemSerialNumbers,
  POSItem,
} from 'src/components/POS/types';
import { Item } from 'models/baseModels/Item/Item';
import { ModalName } from 'src/components/POS/types';
import { Money } from 'pesa';
import { Payment } from 'models/baseModels/Payment/Payment';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { Shipment } from 'models/inventory/Shipment';
import { showToast } from 'src/utils/interactive';
import {
  getItem,
  getItemDiscounts,
  getItemQtyMap,
  getTotalQuantity,
  getTotalTaxedAmount,
  validateIsPosSettingsSet,
  validateShipment,
  validateSinv,
} from 'src/utils/pos';
import Barcode from 'src/components/Controls/Barcode.vue';
import {
  getAddedLPWithGrandTotal,
  getPricingRule,
  removeFreeItems,
} from 'models/helpers';
import LoyaltyProgramModal from './LoyaltyprogramModal.vue';
import AlertModal from './AlertModal.vue';
import SavedInvoiceModal from './SavedInvoiceModal.vue';
import CouponCodeModal from './CouponCodeModal.vue';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import MultiLabelLink from 'src/components/Controls/MultiLabelLink.vue';

export default defineComponent({
  name: 'POS',
  components: {
    Button,
    ClosePOSShiftModal,
    FloatingLabelCurrencyInput,
    FloatingLabelFloatInput,
    ItemsTable,
    ItemsGrid,
    Link,
    MultiLabelLink,
    AlertModal,
    OpenPOSShiftModal,
    PageHeader,
    PaymentModal,
    LoyaltyProgramModal,
    SavedInvoiceModal,
    CouponCodeModal,
    SelectedItemTable,
    Barcode,
  },
  provide() {
    return {
      cashAmount: computed(() => this.cashAmount),
      doc: computed(() => this.sinvDoc),
      isDiscountingEnabled: computed(() => this.isDiscountingEnabled),
      itemDiscounts: computed(() => this.itemDiscounts),
      itemQtyMap: computed(() => this.itemQtyMap),
      itemSerialNumbers: computed(() => this.itemSerialNumbers),
      sinvDoc: computed(() => this.sinvDoc),
      appliedCoupons: computed(() => this.sinvDoc.coupons),
      coupons: computed(() => this.coupons),
      totalTaxedAmount: computed(() => this.totalTaxedAmount),
      transferAmount: computed(() => this.transferAmount),
      transferClearanceDate: computed(() => this.transferClearanceDate),
      transferRefNo: computed(() => this.transferRefNo),
    };
  },
  data() {
    return {
      items: [] as POSItem[],

      tableView: true,

      isItemsSeeded: false,
      openPaymentModal: false,
      openLoyaltyProgramModal: false,
      openSavedInvoiceModal: false,
      openCouponCodeModal: false,
      openAppliedCouponsModal: false,
      openShiftCloseModal: false,
      openShiftOpenModal: false,
      openRouteToInvoiceListModal: false,

      additionalDiscounts: fyo.pesa(0),
      cashAmount: fyo.pesa(0),
      itemDiscounts: fyo.pesa(0),
      totalTaxedAmount: fyo.pesa(0),
      transferAmount: fyo.pesa(0),

      totalQuantity: 0,

      loyaltyPoints: 0,
      appliedLoyaltyPoints: 0,
      loyaltyProgram: '' as string,

      appliedCoupons: [] as AppliedCouponCodes[],
      appliedCouponsCount: 0,

      defaultCustomer: undefined as string | undefined,
      itemSearchTerm: '',
      transferRefNo: undefined as string | undefined,

      transferClearanceDate: undefined as Date | undefined,

      itemQtyMap: {} as ItemQtyMap,
      itemSerialNumbers: {} as ItemSerialNumbers,
      paymentDoc: {} as Payment,
      sinvDoc: {} as SalesInvoice,
      coupons: {} as AppliedCouponCodes,
    };
  },
  computed: {
    defaultPOSCashAccount: () =>
      fyo.singles.POSSettings?.cashAccount ?? undefined,
    isDiscountingEnabled(): boolean {
      return !!fyo.singles.AccountingSettings?.enableDiscounting;
    },
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
    isPaymentAmountSet(): boolean {
      if (this.sinvDoc.grandTotal?.isZero()) {
        return true;
      }

      if (this.cashAmount.isZero() && this.transferAmount.isZero()) {
        return false;
      }
      return true;
    },
    disablePayButton(): boolean {
      if (!this.sinvDoc.items?.length) {
        return true;
      }

      if (!this.sinvDoc.party) {
        return true;
      }
      return false;
    },
  },
  watch: {
    sinvDoc: {
      handler() {
        this.updateValues();
      },
      deep: true,
    },
  },

  async mounted() {
    await this.setItems();
  },
  async activated() {
    toggleSidebar(false);
    validateIsPosSettingsSet(fyo);
    this.setCouponCodeDoc();
    this.setSinvDoc();
    this.setDefaultCustomer();
    await this.setItemQtyMap();
    await this.setItems();
  },
  deactivated() {
    toggleSidebar(true);
  },
  methods: {
    async setCustomer(value: string) {
      if (!value) {
        this.sinvDoc.party = '';
        return;
      }

      this.sinvDoc.party = value;

      const party = await this.fyo.db.getAll(ModelNameEnum.Party, {
        fields: ['loyaltyProgram', 'loyaltyPoints'],
        filters: { name: value },
      });

      this.loyaltyProgram = party[0]?.loyaltyProgram as string;
      this.loyaltyPoints = party[0]?.loyaltyPoints as number;
    },
    async saveOrder() {
      try {
        await this.validate();
        await this.sinvDoc.runFormulas();
        await this.sinvDoc.sync();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }

      showToast({
        type: 'success',
        message: t`Sales Invoice ${this.sinvDoc.name as string} is Saved`,
        duration: 'short',
      });

      await this.afterSync();
    },
    async setItems() {
      const items = (await fyo.db.getAll(ModelNameEnum.Item, {
        fields: [],
        filters: { trackItem: true },
      })) as Item[];

      this.items = [] as POSItem[];
      for (const item of items) {
        let availableQty = 0;

        if (!!this.itemQtyMap[item.name as string]) {
          availableQty = this.itemQtyMap[item.name as string].availableQty;
        }

        if (!item.name) {
          return;
        }

        this.items.push({
          availableQty,
          name: item.name,
          image: item?.image as string,
          rate: item.rate as Money,
          unit: item.unit as string,
          hasBatch: !!item.hasBatch,
          hasSerialNumber: !!item.hasSerialNumber,
        });
      }
    },
    toggleView() {
      this.tableView = !this.tableView;
    },
    setCashAmount(amount: Money) {
      this.cashAmount = amount;
    },
    setDefaultCustomer() {
      this.defaultCustomer = this.fyo.singles.Defaults?.posCustomer ?? '';
      this.sinvDoc.party = this.defaultCustomer;
    },
    setItemDiscounts() {
      this.itemDiscounts = getItemDiscounts(
        this.sinvDoc.items as SalesInvoiceItem[]
      );
    },
    async setItemQtyMap() {
      this.itemQtyMap = await getItemQtyMap();
    },
    setSinvDoc() {
      this.sinvDoc = this.fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
        account: 'Debtors',
        party: this.sinvDoc.party ?? this.defaultCustomer,
        isPOS: true,
      }) as SalesInvoice;
    },
    setCouponCodeDoc() {
      this.coupons = this.fyo.doc.getNewDoc(
        ModelNameEnum.AppliedCouponCodes
      ) as AppliedCouponCodes;
    },
    setAppliedCoupons() {
      this.appliedCoupons = this.sinvDoc.coupons as AppliedCouponCodes[];
    },
    setTotalQuantity() {
      this.totalQuantity = getTotalQuantity(
        this.sinvDoc.items as SalesInvoiceItem[]
      );
    },
    setTotalTaxedAmount() {
      this.totalTaxedAmount = getTotalTaxedAmount(this.sinvDoc as SalesInvoice);
    },
    setCouponsCount(value: number) {
      this.appliedCouponsCount = value;
    },
    async setLoyaltyPoints(value: number) {
      this.appliedLoyaltyPoints = value;

      this.sinvDoc.redeemLoyaltyPoints = true;

      const totalLotaltyAmount = await getAddedLPWithGrandTotal(
        this.fyo,
        this.loyaltyProgram,
        value
      );

      const total = totalLotaltyAmount
        .sub(this.sinvDoc.baseGrandTotal as Money)
        .abs();

      this.sinvDoc.grandTotal = total;
    },
    async selectedInvoiceName(doc: SalesInvoice) {
      const salesInvoiceDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        doc.name
      )) as SalesInvoice;

      this.sinvDoc = salesInvoiceDoc;
      this.toggleModal('SavedInvoice', false);
    },
    setTransferAmount(amount: Money = fyo.pesa(0)) {
      this.transferAmount = amount;
    },
    setTransferClearanceDate(date: Date) {
      this.transferClearanceDate = date;
    },
    setTransferRefNo(ref: string) {
      this.transferRefNo = ref;
    },

    async addItem(item: POSItem | Item | undefined) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.sinvDoc.runFormulas();

      if (!item) {
        return;
      }

      if (
        !this.itemQtyMap[item.name as string] ||
        this.itemQtyMap[item.name as string].availableQty === 0
      ) {
        showToast({
          type: 'error',
          message: t`Item ${item.name as string} has Zero Quantity`,
          duration: 'short',
        });
        return;
      }

      const existingItems =
        this.sinvDoc.items?.filter(
          (invoiceItem) =>
            invoiceItem.item === item.name && !invoiceItem.isFreeItem
        ) ?? [];

      if (item.hasBatch) {
        for (const invItem of existingItems) {
          const itemQty = invItem.quantity ?? 0;
          const qtyInBatch =
            this.itemQtyMap[invItem.item as string][invItem.batch as string] ??
            0;

          if (itemQty < qtyInBatch) {
            invItem.quantity = (invItem.quantity as number) + 1;
            invItem.rate = item.rate as Money;

            await this.applyPricingRule();
            await this.sinvDoc.runFormulas();

            return;
          }
        }

        try {
          await this.sinvDoc.append('items', {
            rate: item.rate as Money,
            item: item.name,
          });
        } catch (error) {
          showToast({
            type: 'error',
            message: t`${error as string}`,
          });
        }

        return;
      }

      if (existingItems.length) {
        existingItems[0].rate = item.rate as Money;
        existingItems[0].quantity = (existingItems[0].quantity as number) + 1;
        await this.applyPricingRule();
        await this.sinvDoc.runFormulas();
        return;
      }

      await this.sinvDoc.append('items', {
        rate: item.rate as Money,
        item: item.name,
      });

      await this.applyPricingRule();
      await this.sinvDoc.runFormulas();
    },
    async createTransaction(shouldPrint = false) {
      try {
        await this.validate();
        await this.submitSinvDoc(shouldPrint);
        await this.makePayment();
        await this.makeStockTransfer();
        await this.afterTransaction();
        await this.setItems();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makePayment() {
      this.paymentDoc = this.sinvDoc.getPayment() as Payment;
      const paymentMethod = this.cashAmount.isZero() ? 'Transfer' : 'Cash';
      await this.paymentDoc.set('paymentMethod', paymentMethod);

      if (paymentMethod === 'Transfer') {
        await this.paymentDoc.setMultiple({
          amount: this.transferAmount as Money,
          referenceId: this.transferRefNo,
          clearanceDate: this.transferClearanceDate,
        });
      }

      if (paymentMethod === 'Cash') {
        await this.paymentDoc.setMultiple({
          paymentAccount: this.defaultPOSCashAccount,
          amount: this.cashAmount as Money,
        });
      }

      this.paymentDoc.once('afterSubmit', () => {
        showToast({
          type: 'success',
          message: t`Payment ${this.paymentDoc.name as string} is Saved`,
          duration: 'short',
        });
      });

      try {
        await this.paymentDoc?.sync();
        await this.paymentDoc?.submit();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makeStockTransfer() {
      const shipmentDoc = (await this.sinvDoc.getStockTransfer()) as Shipment;
      if (!shipmentDoc.items) {
        return;
      }

      for (const item of shipmentDoc.items) {
        item.location = fyo.singles.POSSettings?.inventory;
        item.serialNumber =
          this.itemSerialNumbers[item.item as string] ?? undefined;
      }

      shipmentDoc.once('afterSubmit', () => {
        showToast({
          type: 'success',
          message: t`Shipment ${shipmentDoc.name as string} is Submitted`,
          duration: 'short',
        });
      });

      try {
        await shipmentDoc.sync();
        await shipmentDoc.submit();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    openCouponModal() {
      if (this.sinvDoc.party && this.sinvDoc.items?.length) {
        this.toggleModal('CouponCode', true);
      }
    },
    async submitSinvDoc(shouldPrint: boolean) {
      this.sinvDoc.once('afterSubmit', async () => {
        showToast({
          type: 'success',
          message: t`Sales Invoice ${this.sinvDoc.name as string} is Submitted`,
          duration: 'short',
        });

        if (shouldPrint) {
          await routeTo(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `/print/${this.sinvDoc.schemaName}/${this.sinvDoc.name}`
          );
        }
      });

      try {
        await this.validate();
        await this.sinvDoc.runFormulas();
        await this.sinvDoc.sync();
        await this.sinvDoc.submit();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async afterSync() {
      await this.clearValues();
      this.setSinvDoc();
    },
    async afterTransaction() {
      await this.setItemQtyMap();
      await this.clearValues();
      this.setSinvDoc();
      this.toggleModal('Payment', false);
    },
    async clearValues() {
      this.setSinvDoc();
      this.itemSerialNumbers = {};

      this.cashAmount = fyo.pesa(0);
      this.transferAmount = fyo.pesa(0);
      await this.setItems();

      if (!this.defaultCustomer) {
        this.sinvDoc.party = '';
      }
    },
    toggleModal(modal: ModalName, value?: boolean) {
      if (value) {
        return (this[`open${modal}Modal`] = value);
      }
      return (this[`open${modal}Modal`] = !this[`open${modal}Modal`]);
    },
    updateValues() {
      this.setTotalQuantity();
      this.setItemDiscounts();
      this.setTotalTaxedAmount();
    },
    async validate() {
      validateSinv(this.sinvDoc as SalesInvoice, this.itemQtyMap);
      await validateShipment(this.itemSerialNumbers);
    },
    async applyPricingRule() {
      const hasPricingRules = await getPricingRule(
        this.sinvDoc as SalesInvoice
      );

      if (!hasPricingRules || !hasPricingRules.length) {
        this.sinvDoc.pricingRuleDetail = undefined;
        this.sinvDoc.isPricingRuleApplied = false;
        removeFreeItems(this.sinvDoc as SalesInvoice);
        return;
      }

      const appliedPricingRuleCount = this.sinvDoc?.items?.filter(
        (val) => val.isFreeItem
      ).length;

      const recursivePricingRules = hasPricingRules?.filter(
        (val) => val.pricingRule.isRecursive
      );

      setTimeout(async () => {
        if (
          appliedPricingRuleCount !== hasPricingRules?.length ||
          recursivePricingRules
        ) {
          await this.sinvDoc.appendPricingRuleDetail(hasPricingRules);
          await this.sinvDoc.applyProductDiscount();
        }
      }, 1);
    },
    async routeToSinvList() {
      if (!this.sinvDoc.items?.length) {
        return await routeTo('/list/SalesInvoice');
      }

      this.openRouteToInvoiceListModal = true;
    },
    async handleSaveInvoiceAction() {
      if (!this.sinvDoc.party && !this.sinvDoc.items?.length) {
        return;
      }
      await this.saveOrder();
    },
    routeTo,
    getItem,
  },
});
</script>
