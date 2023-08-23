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
        <div
          class="gap-5 grid grid-rows-6"
          style="height: calc(100vh - 6.1rem)"
        >
          <div class="bg-white border p-4 rounded-md row-span-5">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import ClosePOSShiftModal from './ClosePOSShiftModal.vue';
import ItemsTable from 'src/components/NeuPOS/ItemsTable.vue';
import Link from 'src/components/Controls/Link.vue';
import OpenPOSShiftModal from './OpenPOSShiftModal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import PaymentModal from './PaymentModal.vue';
import { computed, defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import { toggleSidebar } from 'src/utils/ui';
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
import SelectedItemTable from 'src/components/NeuPOS/SelectedItemTable.vue';

export default defineComponent({
  name: 'NeuPOS',
  components: {
    Button,
    ClosePOSShiftModal,
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
      itemSerialNumbers: {} as ItemSerialNumbers,
      itemQtyMap: {} as ItemQtyMap,
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
    toggleModal(modal: 'ShiftOpen' | 'ShiftClose', value?: boolean) {
      if (value) {
        return (this[`open${modal}Modal`] = value);
      }
      return (this[`open${modal}Modal`] = !this[`open${modal}Modal`]);
    },
    setDefaultCustomer() {
      this.defaultCustomer = this.fyo.singles.Defaults?.posCustomer ?? '';
      this.customer = this.defaultCustomer;
    },
    async setItemQtyMap(item?: string) {
      // TODO itemQty is not populated on first run

      const filters = {
        item: item,
      };
      const valuationMethod =
        this.fyo.singles.InventorySettings?.valuationMethod ??
        ValuationMethod.FIFO;

      const rawSLEs = await getRawStockLedgerEntries(this.fyo);
      const rawData = getStockLedgerEntries(rawSLEs, valuationMethod);

      const stockBalance = getStockBalanceEntries(rawData, filters);

      for (const row of stockBalance) {
        if (!this.itemQtyMap[row.item]) {
          this.itemQtyMap[row.item] = { availableQty: 0 };
        }
        this.itemQtyMap[row.item][row.batch] = row.balanceQuantity;

        this.itemQtyMap[row.item].availableQty += row.balanceQuantity;
      }

      this.isItemsSeeded = true;
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
    getItem,
  },
});
</script>
