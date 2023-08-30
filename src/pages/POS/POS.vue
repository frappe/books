<template>
  <div class="">
    <PageHeader :title="t`Point of Sale`">
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
          <!-- Item Search -->
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
            :value="itemSearchTerm"
            @keyup.enter="
              async () => await addItem(await getItem(itemSearchTerm))
            "
            @change="(item: string) =>itemSearchTerm= item"
          />
          <ItemsTable @add-item="addItem" />
        </div>
      </div>

      <div class="col-span-7">
        <div class="flex flex-col gap-3" style="height: calc(100vh - 6rem)">
          <div class="bg-white border grow h-full p-4 rounded-md">
            <!-- Customer Search -->
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
                    :read-only="true"
                    :text-right="true"
                    @change="(amount:Money)=> additionalDiscounts= amount"
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
import FloatingLabelCurrencyInput from 'src/components/POS/FloatingLabelCurrencyInput.vue';
import FloatingLabelFloatInput from 'src/components/POS/FloatingLabelFloatInput.vue';
import ItemsTable from 'src/components/POS/ItemsTable.vue';
import Link from 'src/components/Controls/Link.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import PaymentModal from './PaymentModal.vue';
import SelectedItemTable from 'src/components/POS/SelectedItemTable.vue';
import { ValuationMethod } from 'models/inventory/types';
import { computed, defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import {
  getRawStockLedgerEntries,
  getStockBalanceEntries,
  getStockLedgerEntries,
} from 'reports/inventory/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { t } from 'fyo';
import {
  ItemQtyMap,
  ItemSerialNumbers,
  POSItem,
} from 'src/components/POS/types';
import { Item } from 'models/baseModels/Item/Item';
import { ModalName } from 'src/components/POS/types';
import { Money } from 'pesa';
import { Payment } from 'models/baseModels/Payment/Payment';
import { Shipment } from 'models/inventory/Shipment';
import { safeParseFloat } from 'utils/index';
import { showToast } from 'src/utils/interactive';
import { ValidationError } from 'fyo/utils/errors';

export default defineComponent({
  name: 'POS',
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
      itemSearchTerm: '',

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
        await this.updateValues();
      },
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
        if (item.setItemDiscountAmount) {
          itemDiscounts = itemDiscounts.add(item.itemDiscountAmount as Money);
        }

        if (item.amount && (item.itemDiscountPercent as number) > 1) {
          itemDiscounts = itemDiscounts.add(
            item.amount.percent(item.itemDiscountPercent as number)
          );
        }
      }

      this.itemDiscounts = itemDiscounts;
    },
    async setTotalTaxedAmount() {
      if (!this.sinvDoc.items) {
        return;
      }
      let totalTaxedAmount = fyo.pesa(0);
      for (const item of this.sinvDoc.items) {
        await item._applyFormula();

        if (item.itemTaxedTotal?.isZero()) {
          return;
        }
        totalTaxedAmount = totalTaxedAmount.add(item.itemTaxedTotal as Money);
      }
    },
    async updateValues() {
      this.setTotalQuantity();
      this.setItemDiscounts();
      await this.setTotalTaxedAmount();
    },
    async getItem(item: string): Promise<Item | undefined> {
      if (!item) {
        return;
      }
      const itemDoc = (await fyo.doc.getDoc(ModelNameEnum.Item, item)) as Item;
      if (!itemDoc) {
        return;
      }
      return itemDoc;
    },
    async addItem(item: POSItem | Item | undefined) {
      await this.sinvDoc.runFormulas();

      if (!item) {
        return;
      }

      if (
        !this.itemQtyMap[item.name as string] ||
        this.itemQtyMap[item.name as string].availableQty === 0
      ) {
        showToast({
          type: 'error',
          message: t`Item ${item.name as string} has Zero Quantity`,
          duration: 'short',
        });
        return;
      }

      const existingItems =
        this.sinvDoc.items?.filter(
          (invoiceItem) => invoiceItem.item === item.name
        ) ?? [];

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
            rate: item.rate as Money,
            item: item.name,
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
        rate: item.rate as Money,
        item: item.name,
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
    validateSinv() {
      if (!this.sinvDoc.items) {
        return;
      }

      for (const item of this.sinvDoc.items) {
        if (!item.quantity || item.quantity < 1) {
          throw new ValidationError(
            t`Invalid Quantity for Item ${item.item as string}`
          );
        }

        if (!this.itemQtyMap[item.item as string]) {
          throw new ValidationError(
            t`Item ${item.item as string} not in Stock`
          );
        }

        if (item.quantity > this.itemQtyMap[item.item as string].availableQty) {
          throw new ValidationError(
            t`Insufficient Quantity. Item ${item.item as string} has only ${
              this.itemQtyMap[item.item as string].availableQty
            } quantities available. you selected ${item.quantity}`
          );
        }
      }
    },
    async validateShipment() {
      if (!this.itemSerialNumbers) {
        return;
      }

      for (const idx in this.itemSerialNumbers) {
        const serialNumbers = this.itemSerialNumbers[idx].split('\n');

        for (const serialNumber of serialNumbers) {
          const status = await fyo.getValue(
            ModelNameEnum.SerialNumber,
            serialNumber,
            'status'
          );

          if (status !== 'Active') {
            throw new ValidationError(
              t`Serial Number ${serialNumber} status is not Active.`
            );
          }
        }
      }
    },
    async validate() {
      this.validateSinv();
      await this.validateShipment();
    },
    async submitDoc() {
      try {
        await this.validate();
        await this.sinvDoc.runFormulas();
        await this.sinvDoc._callAllTableFieldsApplyFormula();
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
      await this.validateShipment();
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
        await this.validate();
        await this.submitDoc();
        await this.makePayment();
        await this.makeStockTransfer();
        await this.afterTransaction();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    showToast,
  },
});
</script>
