<template>
  <Modal :open-modal="openModal" class="w-3/6 p-4">
    <h1 class="text-xl font-semibold text-center dark:text-gray-100 pb-4">
      Close POS Shift
    </h1>

    <h2 class="mt-4 mb-2 text-lg font-medium dark:text-gray-100">
      Closing Cash
    </h2>
    <Table
      v-if="isValuesSeeded"
      class="text-base"
      :df="getField('closingCash')"
      :show-header="true"
      :border="true"
      :value="posClosingShiftDoc?.closingCash ?? []"
      :read-only="false"
    />

    <h2 class="mt-6 mb-2 text-lg dark:text-gray-100 font-medium">
      Closing Amounts
    </h2>
    <Table
      v-if="isValuesSeeded"
      class="text-base"
      :df="getField('closingAmounts')"
      :show-header="true"
      :border="true"
      :value="posClosingShiftDoc?.closingAmounts"
      :read-only="true"
    />

    <div class="mt-4 grid grid-cols-2 gap-4 items-end">
      <Button
        class="w-full py-5 bg-red-500 dark:bg-red-700"
        @click="$emit('toggleModal', 'ShiftClose', false)"
      >
        <slot>
          <p class="uppercase text-lg text-white font-semibold">
            {{ t`Cancel` }}
          </p>
        </slot>
      </Button>

      <Button
        class="w-full py-5 bg-green-500 dark:bg-green-700"
        @click="handleSubmit"
      >
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
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import Table from 'src/components/Controls/Table.vue';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { OpeningAmounts } from 'models/inventory/Point of Sale/OpeningAmounts';
import { POSOpeningShift } from 'models/inventory/Point of Sale/POSOpeningShift';
import { computed } from 'vue';
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { t } from 'fyo';
import {
  validateClosingAmounts,
  transferPOSCashAndWriteOff,
  getPOSOpeningShiftDoc,
} from 'src/utils/pos';
import { POSClosingShift } from 'models/inventory/Point of Sale/POSClosingShift';

export default defineComponent({
  name: 'ClosePOSShiftModal',
  components: { Button, Modal, Table },
  provide() {
    return {
      doc: computed(() => this.posClosingShiftDoc),
    };
  },
  props: {
    openModal: {
      default: false,
      type: Boolean,
    },
  },
  emits: ['toggleModal'],
  data() {
    return {
      isValuesSeeded: false,

      posOpeningShiftDoc: undefined as POSOpeningShift | undefined,
      posClosingShiftDoc: undefined as POSClosingShift | undefined,
      transactedAmount: {} as Record<string, Money> | undefined,
    };
  },
  watch: {
    openModal: {
      async handler() {
        await this.setTransactedAmount();
        await this.seedClosingAmounts();
      },
    },
  },
  async activated() {
    this.posClosingShiftDoc = fyo.doc.getNewDoc(
      ModelNameEnum.POSClosingShift
    ) as POSClosingShift;
    await this.seedValues();
    await this.setTransactedAmount();
  },
  async updated() {
    this.posOpeningShiftDoc = await getPOSOpeningShiftDoc(fyo);
    await this.seedValues();
  },
  methods: {
    async setTransactedAmount() {
      this.posOpeningShiftDoc = await getPOSOpeningShiftDoc(fyo);

      const fromDate = this.posOpeningShiftDoc?.openingDate as Date;
      if (!fromDate) {
        return;
      }

      this.transactedAmount = await fyo.db.getPOSTransactedAmount(
        fromDate,
        new Date()
      );
    },
    seedClosingCash() {
      if (!this.posClosingShiftDoc) {
        return;
      }

      this.posClosingShiftDoc.closingCash = [];

      this.posOpeningShiftDoc?.openingCash?.map(async (row) => {
        await this.posClosingShiftDoc?.append('closingCash', {
          count: row.count,
          denomination: row.denomination as Money,
        });
      });
    },
    async seedClosingAmounts() {
      if (!this.posClosingShiftDoc || !this.posOpeningShiftDoc) {
        return;
      }

      this.posClosingShiftDoc.closingAmounts = [];

      const openingAmounts = this.posOpeningShiftDoc
        ?.openingAmounts as OpeningAmounts[];

      for (const row of openingAmounts) {
        if (!row.paymentMethod) {
          return;
        }

        let expectedAmount = row.amount ?? fyo.pesa(0);

        if (this.transactedAmount) {
          expectedAmount = expectedAmount.add(
            this.transactedAmount[row.paymentMethod]
          );
        }

        await this.posClosingShiftDoc.append('closingAmounts', {
          paymentMethod: row.paymentMethod,
          openingAmount: row.amount,
          closingAmount: fyo.pesa(0),
          expectedAmount: expectedAmount,
          differenceAmount: fyo.pesa(0),
        });
      }
    },
    async seedValues() {
      this.isValuesSeeded = false;
      this.seedClosingCash();
      await this.seedClosingAmounts();
      this.isValuesSeeded = true;
    },
    getField(fieldname: string) {
      return fyo.getField(ModelNameEnum.POSClosingShift, fieldname);
    },
    async handleSubmit() {
      try {
        validateClosingAmounts(this.posClosingShiftDoc as POSClosingShift);
        await this.posClosingShiftDoc?.set('isShiftOpen', false);
        await this.posClosingShiftDoc?.set('closingDate', new Date());
        await this.posClosingShiftDoc?.sync();
        await transferPOSCashAndWriteOff(
          fyo,
          this.posClosingShiftDoc as POSClosingShift
        );

        await this.fyo.singles.POSSettings?.setAndSync('isShiftOpen', false);
        this.$emit('toggleModal', 'ShiftClose');
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
          duration: 'short',
        });
      }
    },
  },
});
</script>
