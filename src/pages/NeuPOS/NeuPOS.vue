<template>
  <div class="">
    <PageHeader :title="t`NeuPOS`">
      <slot>
        <Button class="bg-red-500" @click="toggleModal('ShiftClose')">
          <span class="font-medium text-white">{{ t`Close POS Shift ` }}</span>
        </Button>
      </slot>
    </PageHeader>

    <OpenPOSShiftModal
      :open-modal="!isPosShiftOpen"
      @toggle-modal="toggleModal"
    />

    <ClosePOSShiftModal
      :open-modal="openShiftCloseModal"
      @toggle-modal="toggleModal"
    />

    <PaymentModal
      :open-modal="openPaymentModal"
      @create-transaction="createTransaction"
      @toggle-modal="toggleModal"
      @set-cash-amount="setCashAmount"
      @set-transfer-amount="setTransferAmount"
      @set-transfer-ref-no="setTransferRefNo"
    />

    <div
      class="bg-gray-25 gap-2 grid grid-cols-12 p-4"
      style="height: calc(100vh - var(--h-row-largest))"
    >
      <div class="bg-white border col-span-5 rounded-md">
        <div class="rounded-md p-4 col-span-5">
          <Link
            class="border-r flex-shrink-0 w-40"
            :df="{
              label: t`Search an Item`,
              fieldtype: 'Link',
              fieldname: 'item',
              target: 'Item',
            }"
            :border="true"
            :class="['w-full']"
            value=""
            @change="async (item) => (item ? addItem(getItem(item, 0)) : null)"
          />
          <ItemsTable @add-item="addItem" />
        </div>
      </div>

      <div class="col-span-7">
        <div class="flex flex-col gap-3" style="height: calc(100vh - 6rem)">
          <div class="bg-white border grow h-full p-4 rounded-md">
            <Link
              class="flex-shrink-0"
              size="medium"
              :border="true"
              :df="{
                label: t`Customer`,
                fieldtype: 'Link',
                fieldname: 'customer',
                target: 'Party',
                schemaName: 'SalesInvoice',
              }"
              :value="sinvDoc.party"
              @change="(value) => (sinvDoc.party = value)"
            />

            <SelectedItemTable />
          </div>

          <div class="bg-white border p-4 rounded-md">
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
                    :read-only="false"
                    :text-right="true"
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
                    :df="{
                      label: t`Total`,
                      fieldtype: 'Currency',
                      fieldname: 'total',
                    }"
                    size="large"
                    :value="sinvDoc.grandTotal"
                    :read-only="true"
                    :text-right="true"
                  />
                </div>
              </div>

              <div class="">
                <Button class="w-full bg-red-500 py-6" @click="clearValues">
                  <slot>
                    <p class="uppercase text-lg text-white font-semibold">
                      {{ t`Cancel` }}
                    </p>
                  </slot>
                </Button>

                <Button
                  class="mt-4 w-full bg-green-500 py-6"
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
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import FloatingLabelCurrencyInput from 'src/components/NeuPOS/FloatingLabelCurrencyInput.vue';
import FloatingLabelFloatInput from 'src/components/NeuPOS/FloatingLabelFloatInput.vue';
import ItemsTable from 'src/components/NeuPOS/ItemsTable.vue';
import Link from 'src/components/Controls/Link.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import PaymentModal from './PaymentModal.vue';
import SelectedItemTable from 'src/components/NeuPOS/SelectedItemTable.vue';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { fyo } from 'src/initFyo';
import { computed, defineComponent } from 'vue';
import { ValuationMethod } from 'models/inventory/types';
import {
  getRawStockLedgerEntries,
  getStockBalanceEntries,
  getStockLedgerEntries,
} from 'reports/inventory/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { getItem } from 'models/inventory/tests/helpers';
import { t } from 'fyo';
import {
  ItemQtyMap,
  ItemSerialNumbers,
  POSItem,
} from 'src/components/NeuPOS/types';
import { ModalName } from 'src/components/NeuPOS/types';
import { Money } from 'pesa';
import { Payment } from 'models/baseModels/Payment/Payment';
import { Shipment } from 'models/inventory/Shipment';
import { safeParseFloat } from 'utils/index';
import { showToast } from 'src/utils/interactive';

export default defineComponent({
  name: 'NeuPOS',
  components: {
    Button,
    ClosePOSShiftModal,
    FloatingLabelCurrencyInput,
    FloatingLabelFloatInput,
    ItemsTable,
    Link,
    OpenPOSShiftModal,
    PageHeader,
    PaymentModal,
    SelectedItemTable,
  },
  provide() {
    return {
      cashAmount: computed(() => this.cashAmount),
      itemQtyMap: computed(() => this.itemQtyMap),
      itemSerialNumbers: computed(() => this.itemSerialNumbers),
      sinvDoc: computed(() => this.sinvDoc),
      totalTaxedAmount: computed(() => this.totalTaxedAmount),
      transferAmount: computed(() => this.transferAmount),
      transferRefNo: computed(() => this.transferRefNo),
    };
  },
  data() {
    return {
      isItemsSeeded: false,
      openPaymentModal: false,
      openShiftCloseModal: false,
      openShiftOpenModal: false,

      additionalDiscounts: fyo.pesa(0),
      cashAmount: fyo.pesa(0),
      itemDiscounts: fyo.pesa(0),
      totalTaxedAmount: fyo.pesa(0),
      transferAmount: fyo.pesa(0),

      totalQuantity: 0,

      defaultCustomer: undefined as string | undefined,
      transferRefNo: undefined as string | undefined,

      transferClearanceDate: undefined as Date | undefined,

      itemQtyMap: {} as ItemQtyMap,
      itemSerialNumbers: {} as ItemSerialNumbers,
      paymentDoc: {} as Payment,
      sinvDoc: {} as SalesInvoice,
    };
  },
  computed: {
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
  },
  watch: {
    sinvDoc: {
      async handler() {
        await this.sinvDoc.runFormulas();
        this.updateValues();
      },
      deep: true,
    },
  },
  async activated() {
    toggleSidebar(false);
    this.setSinvDoc();
    this.setDefaultCustomer();
    await this.setItemQtyMap();
  },
  deactivated() {
    toggleSidebar(true);
  },
  methods: {
    toggleModal(modal: ModalName, value?: boolean) {
      if (value) {
        return (this[`open${modal}Modal`] = value);
      }
      return (this[`open${modal}Modal`] = !this[`open${modal}Modal`]);
    },
    setDefaultCustomer() {
      this.defaultCustomer = this.fyo.singles.Defaults?.posCustomer ?? '';
      this.sinvDoc.party = this.defaultCustomer;
    },
    async setItemQtyMap() {
      this.itemQtyMap = {};
      const valuationMethod =
        this.fyo.singles.InventorySettings?.valuationMethod ??
        ValuationMethod.FIFO;

      const rawSLEs = await getRawStockLedgerEntries(this.fyo);
      const rawData = getStockLedgerEntries(rawSLEs, valuationMethod);

      const stockBalance = getStockBalanceEntries(rawData, {});

      for (const row of stockBalance) {
        if (!this.itemQtyMap[row.item]) {
          this.itemQtyMap[row.item] = { availableQty: 0 };
        }

        if (row.batch) {
          this.itemQtyMap[row.item][row.batch] = row.balanceQuantity;
        }

        this.itemQtyMap[row.item].availableQty += row.balanceQuantity;
      }
    },
    setTotalQuantity() {
      let totalQuantity = safeParseFloat(0);

      if (!this.sinvDoc.items?.length) {
        this.totalQuantity = totalQuantity;
        return;
      }

      for (const item of this.sinvDoc.items) {
        const quantity = item.quantity ?? 0;
        totalQuantity = safeParseFloat(totalQuantity + quantity);
      }

      this.totalQuantity = totalQuantity;
    },
    setItemDiscounts() {
      let itemDiscounts = fyo.pesa(0);

      if (!this.sinvDoc.items?.length) {
        this.itemDiscounts = itemDiscounts;
        return;
      }

      for (const item of this.sinvDoc.items) {
        itemDiscounts.add(item.itemDiscountedTotal as Money);
      }

      this.itemDiscounts = itemDiscounts;
    },
    updateValues() {
      this.setTotalQuantity();
      this.setItemDiscounts();
    },
    async addItem(item: POSItem) {
      if (!item) {
        return;
      }

      await this.sinvDoc.runFormulas();

      if (this.itemQtyMap[item.item].availableQty === 0) {
        showToast({
          type: 'error',
          message: t`Item ${item.item} has Zero Quantity`,
          duration: 'short',
        });
      }

      const existingItems =
        this.sinvDoc.items?.filter((item) => item.item === item.item) ?? [];

      if (item.hasBatch) {
        for (const item of existingItems) {
          const itemQty = item.quantity ?? 0;
          const qtyInBatch =
            this.itemQtyMap[item.item as string][item.batch as string] ?? 0;

          if (itemQty < qtyInBatch) {
            item.quantity = (item.quantity as number) + 1;
            return;
          }
        }

        try {
          await this.sinvDoc.append('items', {
            ...item,
            item: item.item,
            name: undefined,
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
        existingItems[0].quantity = (existingItems[0].quantity as number) + 1;
        return;
      }

      await this.sinvDoc.append('items', {
        ...item,
        name: undefined,
        item: item.item,
      });
    },
    setSinvDoc() {
      this.sinvDoc = this.fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
        account: 'Debtors',
        party: this.sinvDoc.party ?? this.defaultCustomer,
      }) as SalesInvoice;
    },
    setCashAmount(amount: Money) {
      this.cashAmount = amount;
    },
    setTransferAmount(amount: Money = fyo.pesa(0)) {
      this.transferAmount = amount;
    },
    setTransferRefNo(ref: string) {
      this.transferRefNo = ref;
    },
    setTransferClearanceDate(date: Date) {
      this.transferClearanceDate = date;
    },
    clearValues() {
      this.sinvDoc.items = [];
      this.itemSerialNumbers = {};

      this.cashAmount = fyo.pesa(0);
      this.transferAmount = fyo.pesa(0);
    },
    async submitDoc() {
      try {
        await this.sinvDoc.sync();
        await this.sinvDoc.submit();
        this.paymentDoc = this.sinvDoc.getPayment() as Payment;
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makePayment() {
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
        await this.paymentDoc.set('amount', this.cashAmount as Money);
      }

      try {
        await this.paymentDoc?.sync();
        await this.paymentDoc?.submit();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makeStockTransfer() {
      const shipment = (await this.sinvDoc.getStockTransfer()) as Shipment;
      if (!shipment.items) {
        return;
      }

      for (const item of shipment.items) {
        item.serialNumber =
          this.itemSerialNumbers[item.item as string] ?? undefined;
      }

      try {
        await shipment.sync();
        await shipment.submit();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async afterTransaction() {
      await this.setItemQtyMap();
      this.clearValues();
      this.setSinvDoc();
      this.toggleModal('Payment', false);
    },
    async createTransaction(shouldPrint = false) {
      this.sinvDoc.once('afterSubmit', async () => {
        showToast({
          type: 'success',
          message: t`${this.sinvDoc.name as string} is Submitted`,
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
        await this.submitDoc();
        await this.makePayment();
        await this.makeStockTransfer();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    getItem,
    showToast,
  },
});
</script>
