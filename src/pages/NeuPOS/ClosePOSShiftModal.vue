<template>
  <Modal class="w-3/6 p-4">
    <h1 class="text-xl font-semibold text-center pb-4">Close POS Shift</h1>

    <h2 class="mt-4 mb-2 text-lg font-medium">Closing Cash</h2>
    <Table
      v-if="isValuesSeeded"
      class="text-base"
      :df="getField('closingCash')"
      :show-header="true"
      :border="true"
      :value="posShiftDoc?.closingCash ?? []"
      :read-only="false"
      @row-change="handleChange"
    />

    <h2 class="mt-6 mb-2 text-lg font-medium">Closing Amounts</h2>
    <Table
      v-if="isValuesSeeded"
      class="text-base"
      :df="getField('closingAmounts')"
      :show-header="true"
      :border="true"
      :value="posShiftDoc?.closingAmounts"
      :read-only="true"
      @row-change="handleChange"
    />

    <div class="mt-4 grid grid-cols-2 gap-4 flex items-end">
      <Button
        class="w-full py-5 bg-red-500"
        @click="$emit('toggleModal', 'ShiftClose', false)"
      >
        <slot>
          <p class="uppercase text-lg text-white font-semibold">
            {{ t`Cancel` }}
          </p>
        </slot>
      </Button>

      <Button class="w-full py-5 bg-green-500" @click="handleSubmit">
        <slot>
          <p class="uppercase text-lg text-white font-semibold">
            {{ t`Submit` }}
          </p>
        </slot>
      </Button>
    </div>
  </Modal>
</template>

<script lang="ts">
import { OpeningAmounts } from 'models/inventory/Point of Sale/OpeningAmounts';
import { POSShift } from 'models/inventory/Point of Sale/POSShift';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import Button from 'src/components/Button.vue';
import Table from 'src/components/Controls/Table.vue';
import Modal from 'src/components/Modal.vue';
import { fyo } from 'src/initFyo';
import { computed } from 'vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ClosePOSShiftModal',
  components: { Modal, Table, Button },
  provide() {
    return {
      doc: computed(() => this.posShiftDoc),
    };
  },
  emits: ['toggleModal'],
  data() {
    return {
      isValuesSeeded: false,

      posShiftDoc: undefined as POSShift | undefined,
      transactedAmount: {} as Record<string, Money> | undefined,
    };
  },
  async mounted() {
    this.posShiftDoc = fyo.singles[ModelNameEnum.POSShift];
    await this.seedValues();
  },
  methods: {
    async setTransactedAmount() {
      const fromDate = fyo.singles.POSShift?.openingDate as Date;
      this.transactedAmount = await fyo.db.getPOSTransactedAmount(fromDate);
    },
    seedClosingCash() {
      if (!this.posShiftDoc) {
        return;
      }

      this.posShiftDoc.closingCash = [];

      this.posShiftDoc?.openingCash?.map(async (row) => {
        await this.posShiftDoc?.append('closingCash', {
          count: row.count,
          denomination: row.denomination as Money,
        });
      });
    },
    async seedClosingAmounts() {
      if (!this.posShiftDoc) {
        return;
      }

      await this.setTransactedAmount();

      this.posShiftDoc.closingAmounts = [];
      await this.posShiftDoc.sync();

      const openingAmounts = this.posShiftDoc
        .openingAmounts as OpeningAmounts[];

      for (const row of openingAmounts) {
        if (!row.paymentMethod) {
          return;
        }

        let expectedAmount = fyo.pesa(0);

        if (row.paymentMethod === 'Cash') {
          expectedAmount = expectedAmount.add(
            this.posShiftDoc.openingCashAmount as Money
          );
        }

        if (row.paymentMethod === 'Transfer') {
          expectedAmount = expectedAmount.add(
            this.posShiftDoc.openingTransferAmount as Money
          );
        }

        if (this.transactedAmount) {
          expectedAmount = expectedAmount.add(
            this.transactedAmount[row.paymentMethod]
          );
        }

        await this.posShiftDoc.append('closingAmounts', {
          paymentMethod: row.paymentMethod,
          openingAmount: row.amount,
          closingAmount: fyo.pesa(0),
          expectedAmount: expectedAmount,
          differenceAmount: fyo.pesa(0),
        });
        await this.posShiftDoc.sync();
      }
    },
    async seedValues() {
      this.isValuesSeeded = false;
      this.seedClosingCash();
      await this.seedClosingAmounts();
      this.isValuesSeeded = true;
    },
    setClosingCashAmount() {
      if (!this.posShiftDoc?.closingAmounts) {
        return;
      }

      this.posShiftDoc.closingAmounts.map((row) => {
        if (row.paymentMethod === 'Cash') {
          row.closingAmount = this.posShiftDoc?.closingCashAmount;
        }
      });
    },
    getField(fieldname: string) {
      return this.fyo.getField(ModelNameEnum.POSShift, fieldname);
    },
    async handleChange() {
      await this.posShiftDoc?.sync();
      this.setClosingCashAmount();
    },
    async handleSubmit() {
      this.$emit('toggleModal', 'ShiftClose');
      await this.posShiftDoc?.setMultiple({
        isShiftOpen: false,
      });
      await this.posShiftDoc?.sync();
    },
  },
});
</script>
