<template>
  <div class="flex-col">
    <PageHeader
      :title="
        fyo.singles.POSSettings?.posUI === 'Classic'
          ? t`Point of Sale (Classic)`
          : t`Point of Sale (Modern)`
      "
    >
      <slot>
        <Button
          class="bg-red-500 dark:bg-red-700"
          @click="toggleModal('ShiftClose')"
        >
          <span class="font-medium text-white">{{ t`Close POS Shift ` }}</span>
        </Button>
      </slot>
    </PageHeader>
    <ClassicPOS v-if="fyo.singles.POSSettings?.posUI == 'Classic'" />
    <ModernPOS v-else />
  </div>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { computed, defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import { routeTo, toggleSidebar } from 'src/utils/ui';
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
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { Shipment } from 'models/inventory/Shipment';
import { showToast } from 'src/utils/interactive';
import {
  getItem,
  getItemDiscounts,
  getItemQtyMap,
  getTotalQuantity,
  getTotalTaxedAmount,
  validateIsPosSettingsSet,
  validateShipment,
  validateSinv,
} from 'src/utils/pos';
import {
  getAddedLPWithGrandTotal,
  getPricingRule,
  removeFreeItems,
} from 'models/helpers';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import ClassicPOS from './ClassicPOS.vue';
import ModernPOS from './ModernPOS.vue';

export default defineComponent({
  name: 'POS',
  components: {
    Button,
    PageHeader,
    ClassicPOS,
    ModernPOS,
  },
  provide() {
    return {
      cashAmount: computed(() => this.cashAmount),
      doc: computed(() => this.sinvDoc),
      isDiscountingEnabled: computed(() => this.isDiscountingEnabled),
      itemDiscounts: computed(() => this.itemDiscounts),
      itemQtyMap: computed(() => this.itemQtyMap),
      itemSerialNumbers: computed(() => this.itemSerialNumbers),
      sinvDoc: computed(() => this.sinvDoc),
      appliedCoupons: computed(() => this.sinvDoc.coupons),
      coupons: computed(() => this.coupons),
      totalTaxedAmount: computed(() => this.totalTaxedAmount),
      transferAmount: computed(() => this.transferAmount),
      transferClearanceDate: computed(() => this.transferClearanceDate),
      transferRefNo: computed(() => this.transferRefNo),
    };
  },
  data() {
    return {
      items: [] as POSItem[],

      tableView: true,

      isItemsSeeded: false,
      openPaymentModal: false,
      openLoyaltyProgramModal: false,
      openSavedInvoiceModal: false,
      openCouponCodeModal: false,
      openAppliedCouponsModal: false,
      openShiftCloseModal: false,
      openShiftOpenModal: false,
      openRouteToInvoiceListModal: false,

      additionalDiscounts: fyo.pesa(0),
      cashAmount: fyo.pesa(0),
      itemDiscounts: fyo.pesa(0),
      totalTaxedAmount: fyo.pesa(0),
      transferAmount: fyo.pesa(0),

      totalQuantity: 0,

      loyaltyPoints: 0,
      appliedLoyaltyPoints: 0,
      loyaltyProgram: '' as string,

      appliedCoupons: [] as AppliedCouponCodes[],
      appliedCouponsCount: 0,

      defaultCustomer: undefined as string | undefined,
      itemSearchTerm: '',
      transferRefNo: undefined as string | undefined,

      transferClearanceDate: undefined as Date | undefined,

      itemQtyMap: {} as ItemQtyMap,
      itemSerialNumbers: {} as ItemSerialNumbers,
      paymentDoc: {} as Payment,
      sinvDoc: {} as SalesInvoice,
      coupons: {} as AppliedCouponCodes,
    };
  },
  computed: {
    defaultPOSCashAccount: () =>
      fyo.singles.POSSettings?.cashAccount ?? undefined,
    isDiscountingEnabled(): boolean {
      return !!fyo.singles.AccountingSettings?.enableDiscounting;
    },
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
    isPaymentAmountSet(): boolean {
      if (this.sinvDoc.grandTotal?.isZero()) {
        return true;
      }

      if (this.cashAmount.isZero() && this.transferAmount.isZero()) {
        return false;
      }
      return true;
    },
    disablePayButton(): boolean {
      if (!this.sinvDoc.items?.length) {
        return true;
      }

      if (!this.sinvDoc.party) {
        return true;
      }
      return false;
    },
  },
  watch: {
    sinvDoc: {
      handler() {
        this.updateValues();
      },
      deep: true,
    },
  },

  async mounted() {
    await this.setItems();
  },
  async activated() {
    toggleSidebar(false);
    validateIsPosSettingsSet(fyo);
    this.setCouponCodeDoc();
    this.setSinvDoc();
    this.setDefaultCustomer();
    await this.setItemQtyMap();
    await this.setItems();
  },
  deactivated() {
    toggleSidebar(true);
  },
  methods: {
    async setCustomer(value: string) {
      if (!value) {
        this.sinvDoc.party = '';
        return;
      }

      this.sinvDoc.party = value;

      const party = await this.fyo.db.getAll(ModelNameEnum.Party, {
        fields: ['loyaltyProgram', 'loyaltyPoints'],
        filters: { name: value },
      });

      this.loyaltyProgram = party[0]?.loyaltyProgram as string;
      this.loyaltyPoints = party[0]?.loyaltyPoints as number;
    },
    async saveOrder() {
      try {
        await this.validate();
        await this.sinvDoc.runFormulas();
        await this.sinvDoc.sync();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }

      showToast({
        type: 'success',
        message: t`Sales Invoice ${this.sinvDoc.name as string} is Saved`,
        duration: 'short',
      });

      await this.afterSync();
    },
    async setItems() {
      const items = (await fyo.db.getAll(ModelNameEnum.Item, {
        fields: [],
        filters: { trackItem: true },
      })) as Item[];

      this.items = [] as POSItem[];
      for (const item of items) {
        let availableQty = 0;

        if (!!this.itemQtyMap[item.name as string]) {
          availableQty = this.itemQtyMap[item.name as string].availableQty;
        }

        if (!item.name) {
          return;
        }

        this.items.push({
          availableQty,
          name: item.name,
          image: item?.image as string,
          rate: item.rate as Money,
          unit: item.unit as string,
          hasBatch: !!item.hasBatch,
          hasSerialNumber: !!item.hasSerialNumber,
        });
      }
    },
    toggleView() {
      this.tableView = !this.tableView;
    },
    setCashAmount(amount: Money) {
      this.cashAmount = amount;
    },
    setDefaultCustomer() {
      this.defaultCustomer = this.fyo.singles.Defaults?.posCustomer ?? '';
      this.sinvDoc.party = this.defaultCustomer;
    },
    setItemDiscounts() {
      this.itemDiscounts = getItemDiscounts(
        this.sinvDoc.items as SalesInvoiceItem[]
      );
    },
    async setItemQtyMap() {
      this.itemQtyMap = await getItemQtyMap();
    },
    setSinvDoc() {
      this.sinvDoc = this.fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
        account: 'Debtors',
        party: this.sinvDoc.party ?? this.defaultCustomer,
        isPOS: true,
      }) as SalesInvoice;
    },
    setCouponCodeDoc() {
      this.coupons = this.fyo.doc.getNewDoc(
        ModelNameEnum.AppliedCouponCodes
      ) as AppliedCouponCodes;
    },
    setAppliedCoupons() {
      this.appliedCoupons = this.sinvDoc.coupons as AppliedCouponCodes[];
    },
    setTotalQuantity() {
      this.totalQuantity = getTotalQuantity(
        this.sinvDoc.items as SalesInvoiceItem[]
      );
    },
    setTotalTaxedAmount() {
      this.totalTaxedAmount = getTotalTaxedAmount(this.sinvDoc as SalesInvoice);
    },
    setCouponsCount(value: number) {
      this.appliedCouponsCount = value;
    },
    async setLoyaltyPoints(value: number) {
      this.appliedLoyaltyPoints = value;

      this.sinvDoc.redeemLoyaltyPoints = true;

      const totalLotaltyAmount = await getAddedLPWithGrandTotal(
        this.fyo,
        this.loyaltyProgram,
        value
      );

      const total = totalLotaltyAmount
        .sub(this.sinvDoc.baseGrandTotal as Money)
        .abs();

      this.sinvDoc.grandTotal = total;
    },
    async selectedInvoiceName(doc: SalesInvoice) {
      const salesInvoiceDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        doc.name
      )) as SalesInvoice;

      this.sinvDoc = salesInvoiceDoc;
      this.toggleModal('SavedInvoice', false);
    },
    setTransferAmount(amount: Money = fyo.pesa(0)) {
      this.transferAmount = amount;
    },
    setTransferClearanceDate(date: Date) {
      this.transferClearanceDate = date;
    },
    setTransferRefNo(ref: string) {
      this.transferRefNo = ref;
    },

    async addItem(item: POSItem | Item | undefined) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
          (invoiceItem) =>
            invoiceItem.item === item.name && !invoiceItem.isFreeItem
        ) ?? [];

      if (item.hasBatch) {
        for (const invItem of existingItems) {
          const itemQty = invItem.quantity ?? 0;
          const qtyInBatch =
            this.itemQtyMap[invItem.item as string][invItem.batch as string] ??
            0;

          if (itemQty < qtyInBatch) {
            invItem.quantity = (invItem.quantity as number) + 1;
            invItem.rate = item.rate as Money;

            await this.applyPricingRule();
            await this.sinvDoc.runFormulas();

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
        existingItems[0].rate = item.rate as Money;
        existingItems[0].quantity = (existingItems[0].quantity as number) + 1;
        await this.applyPricingRule();
        await this.sinvDoc.runFormulas();
        return;
      }

      await this.sinvDoc.append('items', {
        rate: item.rate as Money,
        item: item.name,
      });

      await this.applyPricingRule();
      await this.sinvDoc.runFormulas();
    },
    async createTransaction(shouldPrint = false) {
      try {
        await this.validate();
        await this.submitSinvDoc(shouldPrint);
        await this.makePayment();
        await this.makeStockTransfer();
        await this.afterTransaction();
        await this.setItems();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makePayment() {
      this.paymentDoc = this.sinvDoc.getPayment() as Payment;
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
        await this.paymentDoc.setMultiple({
          paymentAccount: this.defaultPOSCashAccount,
          amount: this.cashAmount as Money,
        });
      }

      this.paymentDoc.once('afterSubmit', () => {
        showToast({
          type: 'success',
          message: t`Payment ${this.paymentDoc.name as string} is Saved`,
          duration: 'short',
        });
      });

      try {
        await this.paymentDoc?.sync();
        await this.paymentDoc?.submit();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makeStockTransfer() {
      const shipmentDoc = (await this.sinvDoc.getStockTransfer()) as Shipment;
      if (!shipmentDoc.items) {
        return;
      }

      for (const item of shipmentDoc.items) {
        item.location = fyo.singles.POSSettings?.inventory;
        item.serialNumber =
          this.itemSerialNumbers[item.item as string] ?? undefined;
      }

      shipmentDoc.once('afterSubmit', () => {
        showToast({
          type: 'success',
          message: t`Shipment ${shipmentDoc.name as string} is Submitted`,
          duration: 'short',
        });
      });

      try {
        await shipmentDoc.sync();
        await shipmentDoc.submit();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    openCouponModal() {
      if (this.sinvDoc.party && this.sinvDoc.items?.length) {
        this.toggleModal('CouponCode', true);
      }
    },
    async submitSinvDoc(shouldPrint: boolean) {
      this.sinvDoc.once('afterSubmit', async () => {
        showToast({
          type: 'success',
          message: t`Sales Invoice ${this.sinvDoc.name as string} is Submitted`,
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
        await this.sinvDoc.runFormulas();
        await this.sinvDoc.sync();
        await this.sinvDoc.submit();
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async afterSync() {
      await this.clearValues();
      this.setSinvDoc();
    },
    async afterTransaction() {
      await this.setItemQtyMap();
      await this.clearValues();
      this.setSinvDoc();
      this.toggleModal('Payment', false);
    },
    async clearValues() {
      this.setSinvDoc();
      this.itemSerialNumbers = {};

      this.cashAmount = fyo.pesa(0);
      this.transferAmount = fyo.pesa(0);
      await this.setItems();

      if (!this.defaultCustomer) {
        this.sinvDoc.party = '';
      }
    },
    toggleModal(modal: ModalName, value?: boolean) {
      if (value) {
        return (this[`open${modal}Modal`] = value);
      }
      return (this[`open${modal}Modal`] = !this[`open${modal}Modal`]);
    },
    updateValues() {
      this.setTotalQuantity();
      this.setItemDiscounts();
      this.setTotalTaxedAmount();
    },
    async validate() {
      validateSinv(this.sinvDoc as SalesInvoice, this.itemQtyMap);
      await validateShipment(this.itemSerialNumbers);
    },
    async applyPricingRule() {
      const hasPricingRules = await getPricingRule(
        this.sinvDoc as SalesInvoice
      );

      if (!hasPricingRules || !hasPricingRules.length) {
        this.sinvDoc.pricingRuleDetail = undefined;
        this.sinvDoc.isPricingRuleApplied = false;
        removeFreeItems(this.sinvDoc as SalesInvoice);
        return;
      }

      const appliedPricingRuleCount = this.sinvDoc?.items?.filter(
        (val) => val.isFreeItem
      ).length;

      const recursivePricingRules = hasPricingRules?.filter(
        (val) => val.pricingRule.isRecursive
      );

      setTimeout(async () => {
        if (
          appliedPricingRuleCount !== hasPricingRules?.length ||
          recursivePricingRules
        ) {
          await this.sinvDoc.appendPricingRuleDetail(hasPricingRules);
          await this.sinvDoc.applyProductDiscount();
        }
      }, 1);
    },
    async routeToSinvList() {
      if (!this.sinvDoc.items?.length) {
        return await routeTo('/list/SalesInvoice');
      }

      this.openRouteToInvoiceListModal = true;
    },
    async handleSaveInvoiceAction() {
      if (!this.sinvDoc.party && !this.sinvDoc.items?.length) {
        return;
      }
      await this.saveOrder();
    },
    routeTo,
    getItem,
  },
});
</script>
