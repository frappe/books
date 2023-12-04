<template>
  <Modal class="w-2/6 ml-auto mr-3.5" :set-close-listener="false">
    <div v-if="sinvDoc.fieldMap" class="px-4 py-6 grid" style="height: 95vh">
      <div class="grid grid-cols-2 gap-6">
        <Currency
          :df="fyo.fieldMap.PaymentFor.amount"
          :read-only="!transferAmount.isZero()"
          :border="true"
          :text-right="true"
          :value="cashAmount"
          @change="(amount:Money)=> $emit('setCashAmount', amount)"
        />

        <Button
          class="w-full py-5 bg-teal-500"
          @click="setCashOrTransferAmount"
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Cash` }}
            </p>
          </slot>
        </Button>

        <Currency
          :df="fyo.fieldMap.PaymentFor.amount"
          :read-only="!cashAmount.isZero()"
          :border="true"
          :text-right="true"
          :value="transferAmount"
          @change="(value:Money)=> $emit('setTransferAmount', value)"
        />

        <Button
          class="w-full py-5 bg-teal-500"
          @click="setCashOrTransferAmount('Transfer')"
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Transfer` }}
            </p>
          </slot>
        </Button>
      </div>

      <div class="mt-8 grid grid-cols-2 gap-6">
        <Data
          v-show="!transferAmount.isZero()"
          :df="fyo.fieldMap.Payment.referenceId"
          :show-label="true"
          :border="true"
          :required="!transferAmount.isZero()"
          :value="transferRefNo"
          @change="(value:string) => $emit('setTransferRefNo', value)"
        />

        <Date
          v-show="!transferAmount.isZero()"
          :df="fyo.fieldMap.Payment.clearanceDate"
          :show-label="true"
          :border="true"
          :required="!transferAmount.isZero()"
          :value="transferClearanceDate"
          @change="(value:Date) => $emit('setTransferClearanceDate', value)"
        />
      </div>

      <div class="mt-14 grid grid-cols-2 gap-6">
        <Currency
          v-show="showPaidChange"
          :df="{
            label: t`Paid Change`,
            fieldtype: 'Currency',
            fieldname: 'paidChange',
          }"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="paidChange"
        />

        <Currency
          v-show="showBalanceAmount"
          :df="{
            label: t`Balance Amount`,
            fieldtype: 'Currency',
            fieldname: 'balanceAmount',
          }"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="balanceAmount"
        />
      </div>

      <div
        class="mb-14 row-start-4 row-span-2 grid grid-cols-2 gap-x-6 gap-y-11"
      >
        <Currency
          :df="sinvDoc.fieldMap.netTotal"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="sinvDoc?.netTotal"
        />

        <Currency
          :df="{
            label: t`Taxes and Charges`,
            fieldtype: 'Currency',
            fieldname: 'taxesAndCharges',
          }"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="totalTaxedAmount"
        />

        <Currency
          :df="sinvDoc.fieldMap.baseGrandTotal"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="sinvDoc?.baseGrandTotal"
        />

        <Currency
          v-if="isDiscountingEnabled"
          :df="sinvDoc.fieldMap.discountAmount"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="itemDiscounts"
        />

        <Currency
          :df="sinvDoc.fieldMap.grandTotal"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="sinvDoc?.grandTotal"
        />
      </div>

      <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto">
        <div class="col-span-2">
          <Button
            class="w-full bg-red-500"
            style="padding: 1.35rem"
            @click="$emit('toggleModal', 'Payment')"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Cancel` }}
              </p>
            </slot>
          </Button>
        </div>

        <div class="col-span-1">
          <Button
            class="w-full bg-blue-500"
            style="padding: 1.35rem"
            :disabled="disableSubmitButton"
            @click="$emit('createTransaction')"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Submit` }}
              </p>
            </slot>
          </Button>
        </div>
        <div class="col-span-1">
          <Button
            class="w-full bg-green-500"
            style="padding: 1.35rem"
            :disabled="disableSubmitButton"
            @click="$emit('createTransaction', true)"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Submit & Print` }}
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
import Currency from 'src/components/Controls/Currency.vue';
import Data from 'src/components/Controls/Data.vue';
import Date from 'src/components/Controls/Date.vue';
import Modal from 'src/components/Modal.vue';
import { Money } from 'pesa';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import { fyo } from 'src/initFyo';

export default defineComponent({
  name: 'PaymentModal',
  components: {
    Modal,
    Currency,
    Button,
    Data,
    Date,
  },
  emits: [
    'createTransaction',
    'setCashAmount',
    'setTransferAmount',
    'setTransferClearanceDate',
    'setTransferRefNo',
    'toggleModal',
  ],
  setup() {
    return {
      cashAmount: inject('cashAmount') as Money,
      isDiscountingEnabled: inject('isDiscountingEnabled') as boolean,
      itemDiscounts: inject('itemDiscounts') as Money,
      transferAmount: inject('transferAmount') as Money,
      sinvDoc: inject('sinvDoc') as SalesInvoice,
      transferRefNo: inject('transferRefNo') as string,
      transferClearanceDate: inject('transferClearanceDate') as Date,
      totalTaxedAmount: inject('totalTaxedAmount') as Money,
    };
  },
  computed: {
    balanceAmount(): Money {
      const grandTotal = this.sinvDoc?.grandTotal ?? fyo.pesa(0);

      if (this.cashAmount.isZero()) {
        return grandTotal.sub(this.transferAmount);
      }

      return grandTotal.sub(this.cashAmount);
    },
    paidChange(): Money {
      const grandTotal = this.sinvDoc?.grandTotal ?? fyo.pesa(0);

      if (this.cashAmount.isZero()) {
        return this.transferAmount.sub(grandTotal);
      }

      return this.cashAmount.sub(grandTotal);
    },
    showBalanceAmount(): boolean {
      if (
        this.cashAmount.eq(fyo.pesa(0)) &&
        this.transferAmount.eq(fyo.pesa(0))
      ) {
        return false;
      }

      if (this.cashAmount.gte(this.sinvDoc?.grandTotal ?? fyo.pesa(0))) {
        return false;
      }

      if (this.transferAmount.gte(this.sinvDoc?.grandTotal ?? fyo.pesa(0))) {
        return false;
      }

      return true;
    },
    showPaidChange(): boolean {
      if (
        this.cashAmount.eq(fyo.pesa(0)) &&
        this.transferAmount.eq(fyo.pesa(0))
      ) {
        return false;
      }

      if (this.cashAmount.gt(this.sinvDoc?.grandTotal ?? fyo.pesa(0))) {
        return true;
      }

      if (this.transferAmount.gt(this.sinvDoc?.grandTotal ?? fyo.pesa(0))) {
        return true;
      }

      return false;
    },
    disableSubmitButton(): boolean {
      if (
        !this.sinvDoc.grandTotal?.isZero() &&
        this.transferAmount.isZero() &&
        this.cashAmount.isZero()
      ) {
        return true;
      }

      if (
        this.cashAmount.isZero() &&
        (!this.transferRefNo || !this.transferClearanceDate)
      ) {
        return true;
      }
      return false;
    },
  },
  methods: {
    setCashOrTransferAmount(paymentMethod = 'Cash') {
      if (paymentMethod === 'Transfer') {
        this.$emit('setCashAmount', fyo.pesa(0));
        this.$emit('setTransferAmount', this.sinvDoc?.grandTotal);
        return;
      }
      this.$emit('setTransferAmount', fyo.pesa(0));
      this.$emit('setCashAmount', this.sinvDoc?.grandTotal);
    },
  },
});
</script>
