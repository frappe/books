<template>
  <div class="relative group">
    <div class="bg-gray-100 p-1.5 rounded-md" @click="toggleItemsView">
      <FeatherIcon
        :name="tableView ? 'grid' : 'list'"
        class="w-5 h-5 text-black"
      />
    </div>
    <span
      class="
        p-2
        mb-2
        w-20
        absolute
        bottom-full
        left-1/2
        transform
        -translate-x-1/2
        text-center
        opacity-0
        bg-gray-100
        text-black text-xs
        rounded-md
        transition-opacity
        duration-300
        group-hover:opacity-100
        dark:bg-gray-800 dark:text-white
      "
    >
      {{ tableView ? t`Grid View` : t`List View` }}
    </span>
  </div>

  <div class="relative group">
    <div
      class="px-1.5 py-1 rounded-md bg-gray-100"
      @click="() => $emit('emitRouteToSinvList')"
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
        mb-2
        p-2
        w-28
        absolute
        bottom-full
        left-1/2
        transform
        -translate-x-1/2
        rounded-md
        opacity-0
        bg-gray-100
        text-black text-xs text-center
        transition-opacity
        duration-300
        group-hover:opacity-100
        dark:bg-gray-800 dark:text-white
      "
    >
      {{ t`Sales Invoice List` }}
    </span>
  </div>

  <div
    class="relative group"
    :class="{
      hidden: !fyo.singles.AccountingSettings?.enableLoyaltyProgram,
    }"
  >
    <div
      class="p-1 rounded-md bg-gray-100"
      :class="{
        'bg-gray-100': loyaltyPoints,
        'dark:bg-gray-600 cursor-not-allowed':
          !loyaltyPoints || !sinvDoc?.party || !sinvDoc?.items?.length,
      }"
      @click="openLoyaltyModal"
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
        mb-2
        p-2
        w-28
        absolute
        bottom-full
        left-1/2
        transform
        -translate-x-1/2
        bg-gray-100
        text-black text-xs
        rounded-md
        text-center
        opacity-0
        transition-opacity
        duration-300
        group-hover:opacity-100
        dark:bg-gray-800 dark:text-white
      "
    >
      {{ t`Loyalty Program` }}
    </span>
  </div>

  <div
    class="relative group"
    :class="{
      hidden: !fyo.singles.AccountingSettings?.enableCouponCode,
    }"
  >
    <div
      class="p-0.5 rounded-md bg-gray-100"
      :class="{
        'dark:bg-gray-600 cursor-not-allowed':
          !sinvDoc?.party || !sinvDoc?.items?.length,
      }"
      @click="openCouponModal"
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
        mb-2
        p-2
        w-28
        absolute
        bottom-full
        left-1/2
        transform
        -translate-x-1/2
        bg-gray-100
        text-black text-xs
        rounded-md
        text-center
        opacity-0
        transition-opacity
        duration-300
        group-hover:opacity-100
        dark:bg-gray-800 dark:text-white
      "
    >
      Coupon Code
    </span>
    <div
      v-if="appliedCouponsCount !== 0"
      class="
        h-4
        w-4
        p-2
        absolute
        top-0
        right-0
        transform
        translate-x-1/2
        -translate-y-1/2
        bg-green-400
        text-green-900
        border-red-500
        rounded-full
        flex
        items-center
        justify-center
        text-xs
        cursor-pointer
      "
    >
      {{ appliedCouponsCount }}
    </div>
  </div>

  <div
    class="relative group"
    :class="{
      hidden: !fyo.singles.AccountingSettings?.enablePriceList,
    }"
  >
    <div
      class="p-1 rounded-md bg-gray-100"
      @click="$emit('toggleModal', 'PriceList')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="23px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#000"
      >
        <path
          d="M180.31-164q-27.01 0-45.66-18.65Q116-201.3 116-228.31v-503.38q0-27.01 18.65-45.66Q153.3-796 180.31-796h599.38q27.01 0 45.66 18.65Q844-758.7 844-731.69v503.38q0 27.01-18.65 45.66Q806.7-164 779.69-164H180.31Zm0-52h599.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-503.38q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H180.31q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v503.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85ZM221-297h172v-52H221v52Zm361-77.23L737.77-530 701-566.77l-119 119-51-51L494.23-462 582-374.23ZM221-454h172v-52H221v52Zm0-156h172v-52H221v52Zm-53 394v-528 528Z"
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
      Price List
    </span>
  </div>
  <div
    class="relative group"
    :class="{
      hidden: !fyo.singles.AccountingSettings?.enableItemEnquiry,
    }"
  >
    <div
      class="p-1 rounded-md bg-gray-100"
      @click="$emit('toggleModal', 'ItemEnquiry')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.5"
        class="w-6 h-6 text-black"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.862 4.487l1.686 1.686a1.25 1.25 0 010 1.768L10.06 16.43a.75.75 0 01-.49.219l-2.563.128a.75.75 0 01-.791-.79l.128-2.564a.75.75 0 01.218-.49l8.488-8.489a1.25 1.25 0 011.768 0zM19.5 13.25v4.75a2 2 0 01-2 2h-11a2 2 0 01-2-2v-11a2 2 0 012-2h4.75"
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
      Item Enquiry
    </span>
  </div>
</template>

<script lang="ts">
import { fyo } from 'src/initFyo';
import { defineComponent, PropType } from 'vue';
import { Payment } from 'models/baseModels/Payment/Payment';
import { ItemSerialNumbers } from 'src/components/POS/types';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { showToast } from 'src/utils/interactive';
import { t } from 'fyo';

export default defineComponent({
  name: 'POSQuickActions',
  props: {
    openAlertModal: Boolean,
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
  },
  emits: ['toggleView', 'toggleModal', 'emitRouteToSinvList'],
  data() {
    return {
      tableView: true,

      totalQuantity: 0,
      totalTaxedAmount: fyo.pesa(0),
      additionalDiscounts: fyo.pesa(0),

      paymentDoc: {} as Payment,
      itemSerialNumbers: {} as ItemSerialNumbers,

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
    toggleItemsView() {
      this.tableView = !this.tableView;
      this.$emit('toggleView');
    },
    showValidationToast(action: string, isLoyalty = false) {
      let message = '';

      if (!this.sinvDoc?.items?.length) {
        message = t`Please add items`;
      } else if (!this.sinvDoc?.party) {
        message = t`Please select a customer`;
      } else if (isLoyalty && !this.loyaltyPoints) {
        message = t`Customer has no loyalty points to redeem`;
      }

      showToast({
        type: 'error',
        message: t`${message} before ${action}`,
      });
    },
    openCouponModal() {
      if (!this.sinvDoc?.items?.length || !this.sinvDoc?.party) {
        this.showValidationToast('applying coupon');
        return;
      }
      this.$emit('toggleModal', 'CouponCode');
    },
    openLoyaltyModal() {
      if (
        !this.sinvDoc?.items?.length ||
        !this.sinvDoc?.party ||
        !this.loyaltyPoints
      ) {
        this.showValidationToast('applying loyalty points', true);
        return;
      }
      this.$emit('toggleModal', 'LoyaltyProgram');
    },
  },
});
</script>
