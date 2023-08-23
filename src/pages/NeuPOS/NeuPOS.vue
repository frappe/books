<template>
  <div class="">
    <PageHeader :title="t`NeuPOS`">
      <slot>
        <div class="flex justify-end">
          <Button class="bg-red-500" @click="toggleModal('ShiftClose')">
            <span class="font-medium text-white">{{
              t`Close POS Shift `
            }}</span>
          </Button>
        </div>
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

    <PaymentModal :open-modal="openPaymentModal" @toggle-modal="toggleModal" />

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
            @change="
              async (item: string) => (item ? addItem(getItem(item, 0)) : null)
            "
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
              :value="defaultCustomer"
              @change="(value) => (customer = value)"
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
                <Button
                  class="w-full bg-red-500 py-6"
                  @click="clearSelectedItems"
                >
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
import { toggleSidebar } from 'src/utils/ui';
import { fyo } from 'src/initFyo';
import { computed, defineComponent } from 'vue';
import { ValuationMethod } from 'models/inventory/types';
import {
  getRawStockLedgerEntries,
  getStockBalanceEntries,
  getStockLedgerEntries,
} from 'reports/inventory/helpers';
import { DocValueMap } from 'fyo/core/types';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { ValidationError } from 'fyo/utils/errors';
import { getItem } from 'models/inventory/tests/helpers';
import { handleErrorWithDialog } from 'src/errorHandling';
import { t } from 'fyo';
import { ItemQtyMap, ItemSerialNumbers } from 'src/components/NeuPOS/types';
import { safeParseFloat } from 'utils/index';
import { Money } from 'pesa';
import { ModalName } from 'src/components/NeuPOS/types';

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
      itemQtyMap: computed(() => this.itemQtyMap),
      itemSerialNumbers: computed(() => this.itemSerialNumbers),
      sinvDoc: computed(() => this.sinvDoc),
    };
  },
  data() {
    return {
      isItemsSeeded: false,
      openPaymentModal: false,
      openShiftCloseModal: false,
      openShiftOpenModal: false,

      customer: undefined as string | undefined,
      defaultCustomer: undefined as string | undefined,
      itemQtyMap: {} as ItemQtyMap,
      itemSerialNumbers: {} as ItemSerialNumbers,
      sinvDoc: {} as SalesInvoice,

      totalQuantity: 0,

      additionalDiscounts: fyo.pesa(0),
      itemDiscounts: fyo.pesa(0),
      totalTaxedAmount: fyo.pesa(0),
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
      this.customer = this.defaultCustomer;
    },
    async setItemQtyMap() {
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
        this.itemQtyMap[row.item][row.batch] = row.balanceQuantity;

        this.itemQtyMap[row.item].availableQty += row.balanceQuantity;
      }

      this.isItemsSeeded = true;
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
    async addItem(item: DocValueMap) {
      if (!item) {
        return;
      }

      await this.sinvDoc.runFormulas();

      if (this.itemQtyMap[item.name as string].availableQty === 0) {
        const error = new ValidationError(
          t`Item ${item.name as string} has Zero Quantity`
        );
        await handleErrorWithDialog(error, this.sinvDoc as SalesInvoice);
        throw error;
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
            item: item.name,
            name: undefined,
          });
        } catch (error) {
          await handleErrorWithDialog(error, this.sinvDoc as SalesInvoice);
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
        item: item.name,
      });
    },
    setSinvDoc() {
      this.sinvDoc = this.fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
        account: 'Debtors',
        party: this.customer,
      }) as SalesInvoice;
    },
    clearSelectedItems() {
      this.sinvDoc.items = [];
    },
    getItem,
  },
});
</script>
