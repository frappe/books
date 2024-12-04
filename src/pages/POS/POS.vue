<template>
  <div class="flex-col">
    <PageHeader :title="t`Point of Sale`">
      <slot>
        <Button
          class="bg-red-500 dark:bg-red-700"
          @click="toggleModal('ShiftClose')"
        >
          <span class="font-medium text-white">{{ t`Close POS Shift ` }}</span>
        </Button>
      </slot>
    </PageHeader>
    <ClassicPOS
      v-if="fyo.singles.POSSettings?.posUI == 'Classic'"
      :table-view="tableView"
      :total-quantity="totalQuantity"
      :item-quantity-qap="itemQtyMap"
      :loyalty-points="loyaltyPoints"
      :open-alert-modal="openAlertModal"
      :default-customer="defaultCustomer"
      :is-pos-shift-open="isPosShiftOpen"
      :items="(items as [] as POSItem[])"
      :cash-amount="(cashAmount as Money)"
      :sinv-doc="(sinvDoc as SalesInvoice)"
      :disable-pay-button="disablePayButton"
      :open-payment-modal="openPaymentModal"
      :item-discounts="(itemDiscounts as Money)"
      :coupons="(coupons as AppliedCouponCodes)"
      :open-price-list-modal="openPriceListModal"
      :applied-coupons-count="appliedCouponsCount"
      :open-shift-close-modal="openShiftCloseModal"
      :open-coupon-code-modal="openCouponCodeModal"
      :open-saved-invoice-modal="openSavedInvoiceModal"
      :open-loyalty-program-modal="openLoyaltyProgramModal"
      :open-applied-coupons-modal="openAppliedCouponsModal"
      @add-item="addItem"
      @toggle-view="toggleView"
      @set-sinv-doc="setSinvDoc"
      @clear-values="clearValues"
      @set-customer="setCustomer"
      @toggle-modal="toggleModal"
      @set-cash-amount="setCashAmount"
      @set-coupons-count="setCouponsCount"
      @route-to-sinv-list="routeToSinvList"
      @set-loyalty-points="setLoyaltyPoints"
      @set-transfer-ref-no="setTransferRefNo"
      @apply-pricing-rule="applyPricingRule"
      @create-transaction="createTransaction"
      @save-invoice-action="saveInvoiceAction"
      @set-transfer-amount="setTransferAmount"
      @selected-invoice-name="selectedInvoiceName"
      @set-transfer-clearance-date="setTransferClearanceDate"
    />
    <ModernPOS
      v-else
      :table-view="tableView"
      :total-quantity="totalQuantity"
      :item-quantity-qap="itemQtyMap"
      :loyalty-points="loyaltyPoints"
      :open-alert-modal="openAlertModal"
      :default-customer="defaultCustomer"
      :is-pos-shift-open="isPosShiftOpen"
      :items="(items as [] as POSItem[])"
      :cash-amount="(cashAmount as Money)"
      :sinv-doc="(sinvDoc as SalesInvoice)"
      :disable-pay-button="disablePayButton"
      :open-payment-modal="openPaymentModal"
      :open-keyboard-modal="openKeyboardModal"
      :item-discounts="(itemDiscounts as Money)"
      :coupons="(coupons as AppliedCouponCodes)"
      :open-price-list-modal="openPriceListModal"
      :applied-coupons-count="appliedCouponsCount"
      :open-shift-close-modal="openShiftCloseModal"
      :open-coupon-code-modal="openCouponCodeModal"
      :open-saved-invoice-modal="openSavedInvoiceModal"
      :open-loyalty-program-modal="openLoyaltyProgramModal"
      :open-applied-coupons-modal="openAppliedCouponsModal"
      @add-item="addItem"
      @toggle-view="toggleView"
      @set-sinv-doc="setSinvDoc"
      @clear-values="clearValues"
      @set-customer="setCustomer"
      @toggle-modal="toggleModal"
      @set-cash-amount="setCashAmount"
      @set-coupons-count="setCouponsCount"
      @route-to-sinv-list="routeToSinvList"
      @apply-pricing-rule="applyPricingRule"
      @set-loyalty-points="setLoyaltyPoints"
      @set-transfer-ref-no="setTransferRefNo"
      @create-transaction="createTransaction"
      @save-invoice-action="saveInvoiceAction"
      @set-transfer-amount="setTransferAmount"
      @selected-invoice-name="selectedInvoiceName"
      @set-transfer-clearance-date="setTransferClearanceDate"
    />
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { Money } from 'pesa';
import { fyo } from 'src/initFyo';
import ModernPOS from './ModernPOS.vue';
import ClassicPOS from './ClassicPOS.vue';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import { showToast } from 'src/utils/interactive';
import { Item } from 'models/baseModels/Item/Item';
import { Shipment } from 'models/inventory/Shipment';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { shortcutsKey } from 'src/utils/injectionKeys';
import PageHeader from 'src/components/PageHeader.vue';
import { computed, defineComponent, inject } from 'vue';
import { Payment } from 'models/baseModels/Payment/Payment';
import { ModalName, modalNames } from 'src/components/POS/types';
import { InvoiceItem } from 'models/baseModels/InvoiceItem/InvoiceItem';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from 'models/baseModels/SalesInvoiceItem/SalesInvoiceItem';
import { AppliedCouponCodes } from 'models/baseModels/AppliedCouponCodes/AppliedCouponCodes';
import {
  validateSinv,
  getItemDiscounts,
  validateShipment,
  getTotalQuantity,
  getTotalTaxedAmount,
  validateIsPosSettingsSet,
} from 'src/utils/pos';
import {
  validateQty,
  getItemQtyMap,
  getPricingRule,
  removeFreeItems,
  getAddedLPWithGrandTotal,
  getItemRateFromPriceList,
} from 'models/helpers';
import {
  POSItem,
  ItemQtyMap,
  ItemSerialNumbers,
} from 'src/components/POS/types';

const COMPONENT_NAME = 'POS';

export default defineComponent({
  name: 'POS',
  components: {
    Button,
    ModernPOS,
    PageHeader,
    ClassicPOS,
  },
  provide() {
    return {
      doc: computed(() => this.sinvDoc),
      sinvDoc: computed(() => this.sinvDoc),
      coupons: computed(() => this.coupons),
      itemQtyMap: computed(() => this.itemQtyMap),
      cashAmount: computed(() => this.cashAmount),
      transferRefNo: computed(() => this.transferRefNo),
      itemDiscounts: computed(() => this.itemDiscounts),
      transferAmount: computed(() => this.transferAmount),
      appliedCoupons: computed(() => this.sinvDoc.coupons),
      totalTaxedAmount: computed(() => this.totalTaxedAmount),
      itemSerialNumbers: computed(() => this.itemSerialNumbers),
      isDiscountingEnabled: computed(() => this.isDiscountingEnabled),
      transferClearanceDate: computed(() => this.transferClearanceDate),
    };
  },
  setup() {
    return {
      shortcuts: inject(shortcutsKey),
    };
  },
  data() {
    return {
      tableView: true,

      items: [] as POSItem[],

      openAlertModal: false,
      openPaymentModal: false,
      openKeyboardModal: false,
      openPriceListModal: false,
      openCouponCodeModal: false,
      openShiftCloseModal: false,
      openSavedInvoiceModal: false,
      openLoyaltyProgramModal: false,
      openAppliedCouponsModal: false,

      totalQuantity: 0,
      cashAmount: fyo.pesa(0),
      itemDiscounts: fyo.pesa(0),
      transferAmount: fyo.pesa(0),
      totalTaxedAmount: fyo.pesa(0),
      additionalDiscounts: fyo.pesa(0),

      loyaltyPoints: 0,
      appliedLoyaltyPoints: 0,
      loyaltyProgram: '' as string,

      appliedCouponsCount: 0,
      appliedCoupons: [] as AppliedCouponCodes[],

      itemSearchTerm: '',
      transferRefNo: undefined as string | undefined,
      defaultCustomer: undefined as string | undefined,
      transferClearanceDate: undefined as Date | undefined,

      paymentDoc: {} as Payment,
      sinvDoc: {} as SalesInvoice,
      itemQtyMap: {} as ItemQtyMap,
      coupons: {} as AppliedCouponCodes,
      itemSerialNumbers: {} as ItemSerialNumbers,
    };
  },
  computed: {
    defaultPOSCashAccount: () =>
      fyo.singles.POSSettings?.cashAccount ?? undefined,
    isDiscountingEnabled(): boolean {
      return !!fyo.singles.AccountingSettings?.enableDiscounting;
    },
    isPosShiftOpen: () => !!fyo.singles.POSShift?.isShiftOpen,
    disablePayButton(): boolean {
      if (!this.sinvDoc.items?.length || !this.sinvDoc.party) {
        return true;
      }

      return false;
    },
  },
  watch: {
    sinvDoc: {
      handler() {
        if (this.sinvDoc.coupons?.length) {
          this.setCouponsCount(this.sinvDoc.coupons?.length);
        }

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
    this.setShortcuts();

    await this.setItemQtyMap();
    await this.setItems();
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
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
    isModalOpen() {
      for (const modal of modalNames) {
        if (modal && this[`open${modal}Modal`]) {
          this[`open${modal}Modal`] = false;
          return `open${modal}Modal`;
        }
      }
    },
    setShortcuts() {
      this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyS'], async () => {
        await this.routeToSinvList();
      });

      this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyV'], () => {
        this.toggleView();
      });

      this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyP'], () => {
        this.toggleModal('PriceList');
      });

      this.shortcuts?.pmodShift.set(COMPONENT_NAME, ['KeyH'], () => {
        this.toggleModal('SavedInvoice');
      });

      this.shortcuts?.pmodShift.set(COMPONENT_NAME, ['Backspace'], async () => {
        const modalStatus = this.isModalOpen();

        if (!modalStatus) {
          await this.clearValues();
        }
      });

      this.shortcuts?.pmodShift.set(COMPONENT_NAME, ['KeyP'], () => {
        if (!this.disablePayButton) {
          this.toggleModal('Payment');
        }
      });

      this.shortcuts?.pmodShift.set(COMPONENT_NAME, ['KeyS'], async () => {
        const modalStatus = this.isModalOpen();

        if (!modalStatus && this.sinvDoc.party && this.sinvDoc.items?.length) {
          await this.saveOrder();
        }
      });

      this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyL'], () => {
        if (
          this.fyo.singles.AccountingSettings?.enablePriceList &&
          this.loyaltyPoints &&
          this.sinvDoc.party &&
          this.sinvDoc.items?.length
        ) {
          this.toggleModal('LoyaltyProgram', true);
        }
      });

      this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyC'], () => {
        if (
          this.fyo.singles.AccountingSettings?.enableCouponCode &&
          this.sinvDoc?.party &&
          this.sinvDoc?.items?.length
        ) {
          this.toggleModal('CouponCode');
        }
      });
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
      this.itemQtyMap = await getItemQtyMap(this.sinvDoc as SalesInvoice);
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
      await this.sinvDoc.runFormulas();

      if (!item) {
        return;
      }

      const existingItems =
        this.sinvDoc.items?.filter(
          (invoiceItem) =>
            invoiceItem.item === item.name && !invoiceItem.isFreeItem
        ) ?? [];

      try {
        if (item.hasBatch) {
          for (const invItem of existingItems) {
            const itemQty = invItem.quantity ?? 0;
            const qtyInBatch =
              this.itemQtyMap[invItem.item as string][
                invItem.batch as string
              ] ?? 0;

            if (itemQty < qtyInBatch) {
              invItem.quantity = (invItem.quantity as number) + 1;
              invItem.rate = item.rate as Money;

              await this.applyPricingRule();
              await this.sinvDoc.runFormulas();
              await validateQty(
                this.sinvDoc as SalesInvoice,
                item,
                existingItems as InvoiceItem[]
              );

              return;
            }
          }

          await this.sinvDoc.append('items', {
            rate: item.rate as Money,
            item: item.name,
          });

          return;
        }

        if (existingItems.length) {
          if (!this.sinvDoc.priceList) {
            existingItems[0].rate = item.rate as Money;
          }

          existingItems[0].quantity = (existingItems[0].quantity as number) + 1;

          await this.applyPricingRule();
          await this.sinvDoc.runFormulas();
          await validateQty(
            this.sinvDoc as SalesInvoice,
            item,
            existingItems as InvoiceItem[]
          );

          return;
        }
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }

      await this.sinvDoc.append('items', {
        rate: item.rate as Money,
        item: item.name,
      });

      if (this.sinvDoc.priceList) {
        let itemData = this.sinvDoc.items?.filter(
          (val) => val.item == item.name
        ) as SalesInvoiceItem[];

        itemData[0].rate = await getItemRateFromPriceList(
          itemData[0],
          this.sinvDoc.priceList
        );
      }

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
        await this.sinvDoc.applyProductDiscount();

        return;
      }

      await this.sinvDoc.appendPricingRuleDetail(hasPricingRules);
      await this.sinvDoc.applyProductDiscount();
    },
    async routeToSinvList() {
      if (!this.sinvDoc.items?.length) {
        return await routeTo('/list/SalesInvoice');
      }

      this.openAlertModal = true;
    },
    async saveInvoiceAction() {
      if (!this.sinvDoc.party && !this.sinvDoc.items?.length) {
        return;
      }

      await this.saveOrder();
    },
    routeTo,
  },
});
</script>
