<template>
  <Modal class="h-auto w-96" :set-close-listener="false">
    <p class="text-center font-semibold py-3">Apply Coupon Code</p>
    <div class="px-10">
      <hr class="dark:border-gray-800" />
      <p v-if="appliedCoupons.length" class="text-xs m-2 text-gray-500">
        {{ t`Applied Coupon Codes` }}
      </p>
      <div
        v-if="appliedCoupons.length"
        class="overflow-y-auto mt-2 custom-scroll custom-scroll-thumb2"
        :style="{ height: appliedCoupons.length >= 2 ? '11vh' : '8vh' }"
      >
        <Row
          v-for="(coupon,index) in appliedCoupons as any"
          :key="index"
          :ratio="ratio"
          :border="true"
          class="
            border-b border-l border-r
            dark:border-gray-800
            relative
            group
            h-coupon-mid
            hover:bg-gray-25
            dark:bg-gray-890
            items-center
            justify-center
          "
        >
          <div class="flex flex-row w-full items-center">
            <div class="flex flex-row">
              <FormControl
                v-for="df in tableFields"
                :key="df.fieldname"
                size="large"
                class="w-full"
                :df="df"
                :value="coupon[df.fieldname]"
                :read-only="true"
              />
            </div>
          </div>
          <div class="absolute right-3">
            <feather-icon
              name="trash"
              class="w-4 text-xl text-red-500 cursor-pointer"
              @click="removeAppliedCoupon(coupon)"
            />
          </div>
        </Row>
      </div>

      <div
        v-if="coupons.fieldMap"
        class="flex justify-center"
        :class="appliedCoupons.length ? 'pb-0 pt-4' : 'pt-10'"
      >
        <div class="w-80" :class="appliedCoupons.length ? 'pb-4' : 'pb-10'">
          <Link
            v-if="coupons.fieldMap"
            class="flex-shrink-0"
            :show-label="true"
            :border="true"
            :value="couponCode"
            :df="coupons.fieldMap.coupons"
            @change="updateCouponCode"
          />
        </div>
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-2">
        <div class="col-span-2">
          <Button
            class="w-full bg-green-500 dark:bg-green-700"
            style="padding: 1.35rem"
            :disabled="validationError"
            @click="setCouponCode()"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Save` }}
              </p>
            </slot>
          </Button>
        </div>
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-8">
        <div class="col-span-2">
          <Button
            class="w-full bg-red-500 dark:bg-red-700"
            style="padding: 1.35rem"
            @click="cancelApplyCouponCode()"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Cancel` }}
              </p>
            </slot>
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import { t } from 'fyo';
import { showToast } from 'src/utils/interactive';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import Link from 'src/components/Controls/Link.vue';
import { ModelNameEnum } from 'models/types';
import { updatePricingRule, validateCouponCode } from 'models/helpers';
import { Field } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import Row from 'src/components/Row.vue';

export default defineComponent({
  name: 'CouponCodeModal',
  components: {
    Modal,
    Button,
    Link,
    FormControl,
    Row,
  },
  emits: ['setCouponsCount', 'toggleModal'],

  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
      coupons: inject('coupons') as AppliedCouponCodes,
      appliedCoupons: inject('appliedCoupons') as AppliedCouponCodes[],
    };
  },
  data() {
    return {
      validationError: false,
      couponCode: '',
    };
  },
  computed: {
    ratio() {
      return [1, 0.1, 1, 0.7];
    },
    tableFields() {
      return [
        {
          fieldname: 'coupons',
          fieldtype: 'Link',
          required: true,
          readOnly: true,
        },
      ] as Field[];
    },
  },
  methods: {
    updateCouponCode(value: string) {
      (this.validationError = false), (this.couponCode = value);
    },
    async setCouponCode() {
      try {
        if (!this.couponCode) {
          throw new Error(t`Must be select a coupon code`);
        }

        const appliedCouponCodes = this.fyo.doc.getNewDoc(
          ModelNameEnum.AppliedCouponCodes
        );

        await validateCouponCode(
          appliedCouponCodes as AppliedCouponCodes,
          this.couponCode,
          this.sinvDoc
        );

        await this.sinvDoc.append('coupons', { coupons: this.couponCode });

        await updatePricingRule(this.sinvDoc);
        this.$emit('toggleModal', 'CouponCode');

        this.couponCode = '';
        this.validationError = false;

        this.$emit('setCouponsCount', this.sinvDoc.coupons?.length);
      } catch (error) {
        this.validationError = true;

        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async removeAppliedCoupon(coupon: AppliedCouponCodes) {
      this.sinvDoc.coupons = this.sinvDoc.coupons?.filter(
        (coup) => coup.coupons !== coupon?.coupons
      );

      await updatePricingRule(this.sinvDoc);
      this.$emit('setCouponsCount', this.sinvDoc.coupons?.length);
    },
    cancelApplyCouponCode() {
      this.couponCode = '';
      this.$emit('toggleModal', 'CouponCode');
    },
  },
});
</script>
