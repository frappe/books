<template>
  <Modal class="w-3/6 p-4">
    <h1 class="text-xl font-semibold text-center pb-4">Open POS Shift</h1>

    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-6">
        <h2 class="text-lg font-medium">Cash In Denominations</h2>

        <Table
          v-if="isValuesSeeded"
          class="mt-4 text-base"
          :df="getField('openingCash')"
          :show-header="true"
          :border="true"
          :value="posShiftDoc?.openingCash"
          @row-change="handleChange"
        />
      </div>

      <div class="col-span-6">
        <h2 class="text-lg font-medium">Opening Amount</h2>

        <Table
          v-if="isValuesSeeded"
          class="mt-4 text-base"
          :df="getField('openingAmounts')"
          :show-header="true"
          :border="true"
          :max-rows-before-overflow="4"
          :value="posShiftDoc?.openingAmounts"
          :read-only="true"
          @row-change="handleChange"
        />

        <div class="mt-4 grid grid-cols-2 gap-4 flex items-end">
          <Button class="w-full py-5 bg-red-500" @click="seedDefaults">
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Clear` }}
              </p>
            </slot>
          </Button>

          <Button class="w-full py-5 bg-green-500" @click="handleSubmit">
            <!-- style="padding: 1.35rem" -->
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Submit` }}
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
import Table from 'src/components/Controls/Table.vue';
import { fyo } from 'src/initFyo';
import { defineComponent } from 'vue';
import { computed } from 'vue';
import { POSShift } from 'models/inventory/Point of Sale/POSShift';
import { Money } from 'pesa';
import { ModelNameEnum } from 'models/types';

export default defineComponent({
  name: 'OpenPOSShift',
  components: { Button, Modal, Table },
  provide() {
    return {
      doc: computed(() => this.posShiftDoc),
    };
  },
  emits: ['toggleModal'],
  data() {
    return {
      posShiftDoc: undefined as POSShift | undefined,

      isValuesSeeded: false,
    };
  },
  computed: {
    getDefaultCashDenominations() {
      return this.fyo.singles.Defaults?.posCashDenominations;
    },
  },
  async mounted() {
    this.isValuesSeeded = false;
    this.posShiftDoc = fyo.singles[ModelNameEnum.POSShift];

    await this.seedDefaults();
    this.isValuesSeeded = true;
  },
  methods: {
    async seedDefaultCashDenomiations() {
      if (!this.posShiftDoc) {
        return;
      }

      this.posShiftDoc.openingCash = [];
      await this.posShiftDoc.sync();

      const denominations = this.getDefaultCashDenominations;

      if (!denominations) {
        return;
      }

      for (const row of denominations) {
        await this.posShiftDoc.append('openingCash', {
          denomination: row.denomination,
          count: 0,
        });

        await this.posShiftDoc.sync();
      }
    },
    async seedPaymentMethods() {
      if (!this.posShiftDoc) {
        return;
      }

      this.posShiftDoc.openingAmounts = [];
      await this.posShiftDoc.sync();

      await this.posShiftDoc.set('openingAmounts', [
        {
          paymentMethod: 'Cash',
          amount: fyo.pesa(0),
        },
        {
          paymentMethod: 'Transfer',
          amount: fyo.pesa(0),
        },
      ]);
      await this.posShiftDoc.sync();
    },
    async seedDefaults() {
      if (!!this.posShiftDoc?.isShiftOpen) {
        return;
      }

      await this.seedDefaultCashDenomiations();
      await this.seedPaymentMethods();
    },
    getField(fieldname: string) {
      return this.fyo.getField(ModelNameEnum.POSShift, fieldname);
    },
    setOpeningCashAmount() {
      if (!this.posShiftDoc?.openingAmounts) {
        return;
      }

      this.posShiftDoc.openingAmounts.map((row) => {
        if (row.paymentMethod === 'Cash') {
          row.amount = this.posShiftDoc?.openingCashAmount as Money;
        }
      });
    },
    async handleChange() {
      await this.posShiftDoc?.sync();
      this.setOpeningCashAmount();
    },
    async handleSubmit() {
      await this.posShiftDoc?.setMultiple({
        isShiftOpen: true,
        openingDate: new Date(),
      });

      await this.posShiftDoc?.sync();
      this.$emit('toggleModal', 'ShiftOpen');
    },
  },
});
</script>
