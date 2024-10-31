<template>
  <Modal class="h-auto" :set-close-listener="false">
    <div class="px-5" style="width: 40vw">
      <p class="text-center font-semibold py-3">Keyboard</p>
      <hr class="dark:border-gray-800" />

      <div class="m-6">
        <Float
          ref="quantityInput"
          :df="{
            fieldname: 'quantity',
            fieldtype: 'Float',
            label: 'Quantity',
          }"
          :border="true"
          :show-label="true"
          :value="selectedValue"
          @change="(value:number) => handleInput(value.toString())"
        />

        <div
          id="keypad"
          class="text-4xl grid grid-cols-4 gap-3 py-3 rounded font-bold"
        >
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('7')"
          >
            7
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('8')"
          >
            8
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('9')"
          >
            9
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="deleteLast()"
          >
            Del
          </button>

          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('4')"
          >
            4
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('5')"
          >
            5
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('6')"
          >
            6
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('-')"
          >
            -
          </button>

          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('1')"
          >
            1
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('2')"
          >
            2
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('3')"
          >
            3
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('+')"
          >
            +
          </button>

          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('.')"
          >
            •
          </button>
          <button
            class="bg-gray-900 p-3 border-transparent rounded-lg"
            @click="appendValue('0')"
          >
            0
          </button>
          <div class="grid col-span-2">
            <button
              class="bg-gray-900 p-3 border-transparent rounded-lg"
              @click="reset()"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div class="px-5">
        <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-3">
          <div class="col-span-2">
            <Button
              class="w-full bg-green-500 dark:bg-green-700"
              style="padding: 1.35rem"
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
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import { updatePricingRule } from 'models/helpers';
import Float from 'src/components/Controls/Float.vue';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  name: 'KeyboardModal',
  components: {
    Modal,
    Button,
    Float,
  },
  props: {
    modalStatus: Boolean,
  },
  emits: ['setCouponsCount', 'toggleModal'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      selectedValue: '',
    };
  },
  watch: {
    async modalStatus(newVal) {
      if (newVal) {
        await this.$nextTick();
        (this.$refs.quantityInput as HTMLInputElement)?.focus();
      }
    },
  },
  methods: {
    async appendValue(value: string) {
      if (value === '-') {
        this.selectedValue = this.selectedValue.startsWith('-')
          ? this.selectedValue
          : `-${this.selectedValue}`;
      } else if (value === '+') {
        this.selectedValue = this.selectedValue.startsWith('-')
          ? this.selectedValue.slice(1)
          : this.selectedValue;
      } else if (value === '.') {
        showToast({
          type: 'error',
          message: 'cant use decimal points in Quantity',
        });

        return;
      } else {
        this.selectedValue =
          this.selectedValue === '0' ? value : this.selectedValue + value;
      }

      await this.focusInput();
    },
    handleInput(value: string) {
      this.selectedValue = value;
    },
    async deleteLast() {
      this.selectedValue = this.selectedValue.slice(0, -1);

      await this.focusInput();
    },
    async reset() {
      this.selectedValue = '';

      await this.focusInput();
    },
    async focusInput() {
      await this.$nextTick();
      (this.$refs.quantityInput as HTMLInputElement)?.focus();
    },
    async removeAppliedCoupon(coupon: AppliedCouponCodes) {
      this.sinvDoc.coupons = this.sinvDoc.coupons?.filter(
        (coup) => coup.coupons !== coupon?.coupons
      );

      await updatePricingRule(this.sinvDoc);
      this.$emit('setCouponsCount', this.sinvDoc.coupons?.length);
    },
    async cancelApplyCouponCode() {
      await this.reset();
      this.$emit('toggleModal', 'Keyboard');
    },
  },
});
</script>
