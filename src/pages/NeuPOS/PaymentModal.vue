<template>
  <Modal class="w-2/5 ml-auto mr-3.5" :set-close-listener="false">
    <div class="px-4 py-6 grid" style="height: 95vh">
      <div class="grid grid-cols-2 gap-6">
        <Currency
          :df="{
            label: t`Cash`,
            fieldtype: 'Currency',
            fieldname: 'cash',
          }"
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
          :df="{
            label: t`Transfer`,
            fieldtype: 'Currency',
            fieldname: 'transfer',
          }"
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
          :df="{
            label: t`Transfer Ref No.`,
            fieldtype: 'Data',
            fieldname: 'transferRefNo',
          }"
          :show-label="true"
          :border="true"
          :required="!transferAmount.isZero()"
          :value="transferRefNo"
          @change="(value:string) => $emit('setTransferRefNo', value)"
        />

        <Date
          v-show="!transferAmount.isZero()"
          :df="{
            label: t`Clearance Date`,
            fieldtype: 'Date',
            fieldname: 'transferClearanceDate',
          }"
          :show-label="true"
          :border="true"
          :required="!transferAmount.isZero()"
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
          :df="{
            label: t`Net Total`,
            fieldtype: 'Currency',
            fieldname: 'netTotal',
          }"
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
          :df="{
            label: t`Total Amount`,
            fieldtype: 'Currency',
            fieldname: 'totalAmount',
          }"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
          :value="sinvDoc?.baseGrandTotal"
        />

        <Currency
          :df="{
            label: t`Discount Amount`,
            fieldtype: 'Currency',
            fieldname: 'discountAmount',
          }"
          :read-only="true"
          :show-label="true"
          :border="true"
          :text-right="true"
        />

        <Currency
          :df="{
            label: t`Grand Total`,
            fieldtype: 'Currency',
            fieldname: 'grandTotal',
          }"
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
      transferAmount: inject('transferAmount') as Money,
      sinvDoc: inject('sinvDoc') as SalesInvoice,
      transferRefNo: inject('transferRefNo') as string,
      totalTaxedAmount: inject('totalTaxedAmount') as Money,
    };
  },
  computed: {
    showPaidChange(): boolean {
      if (
        this.cashAmount.eq(fyo.pesa(0)) &&
        this.transferAmount.eq(fyo.pesa(0))
      ) {
        return false;
      }

      if (this.cashAmount.lt(this.sinvDoc?.grandTotal ?? fyo.pesa(0))) {
        return false;
      }

      if (this.transferAmount.gte(this.sinvDoc?.grandTotal ?? fyo.pesa(0))) {
        return false;
      }

      return true;
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
    paidChange(): Money {
      return this.cashAmount.sub(this.sinvDoc?.grandTotal ?? fyo.pesa(0));
    },
    balanceAmount(): Money {
      const grandTotal = this.sinvDoc?.grandTotal ?? fyo.pesa(0);

      if (this.cashAmount.isZero()) {
        return grandTotal.sub(this.transferAmount);
      }

      if (this.transferAmount.isZero()) {
        return grandTotal.sub(this.cashAmount);
      }

      const totalPaidAmount = this.cashAmount.add(this.transferAmount);
      return grandTotal.sub(totalPaidAmount);
    },
  },
  methods: {
    setCashOrTransferAmount(payemtMethod = 'Cash') {
      if (payemtMethod === 'Transfer') {
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
