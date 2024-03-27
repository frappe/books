<template>
  <Modal class="w-3/6 p-4">
    <h1 class="text-xl font-semibold text-center dark:text-gray-100 pb-4">
      Open POS Shift
    </h1>

    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-6">
        <h2 class="text-lg font-medium dark:text-gray-100">
          Cash In Denominations
        </h2>

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
        <h2 class="text-lg font-medium dark:text-gray-100">Opening Amount</h2>

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

        <div class="mt-4 grid grid-cols-2 gap-4 items-end">
          <Button
            class="w-full py-5 bg-red-500 dark:bg-red-700"
            @click="$router.back()"
          >
            <slot>
              <p class="uppercase text-lg text-white font-semibold">
                {{ t`Back` }}
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
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import Table from 'src/components/Controls/Table.vue';
import { AccountTypeEnum } from 'models/baseModels/Account/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { POSShift } from 'models/inventory/Point of Sale/POSShift';
import { computed } from 'vue';
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { t } from 'fyo';
import { ValidationError } from 'fyo/utils/errors';

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
    posCashAccount() {
      return fyo.singles.POSSettings?.cashAccount;
    },
    posOpeningCashAmount(): Money {
      return this.posShiftDoc?.openingCashAmount as Money;
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
      try {
        if (this.posShiftDoc?.openingCashAmount.isNegative()) {
          throw new ValidationError(
            t`Opening Cash Amount can not be negative.`
          );
        }

        await this.posShiftDoc?.setMultiple({
          isShiftOpen: true,
          openingDate: new Date(),
        });

        await this.posShiftDoc?.sync();

        if (!this.posShiftDoc?.openingCashAmount.isZero()) {
          const jvDoc = fyo.doc.getNewDoc(ModelNameEnum.JournalEntry, {
            entryType: 'Journal Entry',
          });

          await jvDoc.append('accounts', {
            account: this.posCashAccount,
            debit: this.posShiftDoc?.openingCashAmount as Money,
            credit: this.fyo.pesa(0),
          });

          await jvDoc.append('accounts', {
            account: AccountTypeEnum.Cash,
            debit: this.fyo.pesa(0),
            credit: this.posShiftDoc?.openingCashAmount as Money,
          });

          await (await jvDoc.sync()).submit();
        }

        this.$emit('toggleModal', 'ShiftOpen');
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
          duration: 'short',
        });
        return;
      }
    },
  },
});
</script>
