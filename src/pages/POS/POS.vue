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
      v-if="
        posProfile?.posUI === 'Classic' ||
        (!posProfile?.posUI && fyo.singles.POSSettings?.posUI === 'Classic')
      "
      :table-view="tableView"
      :profile="(posProfile as POSProfile)"
      :total-quantity="totalQuantity"
      :item-quantity-qap="itemQtyMap"
      :loyalty-points="loyaltyPoints"
      :open-alert-modal="openAlertModal"
      :default-customer="defaultCustomer"
      :item-search-term="itemSearchTerm"
      :selected-item-group="selectedItemGroup"
      :is-pos-shift-open="isPosShiftOpen"
      :items="(items as [] as POSItem[])"
      :sinv-doc="(sinvDoc as SalesInvoice)"
      :disable-pay-button="disablePayButton"
      :open-payment-modal="openPaymentModal"
      :item-discounts="(itemDiscounts as Money)"
      :coupons="(coupons as AppliedCouponCodes)"
      :open-price-list-modal="openPriceListModal"
      :open-item-enquiry-modal="openItemEnquiryModal"
      :applied-coupons-count="appliedCouponsCount"
      :open-shift-close-modal="openShiftCloseModal"
      :open-coupon-code-modal="openCouponCodeModal"
      :open-saved-invoice-modal="openSavedInvoiceModal"
      :open-loyalty-program-modal="openLoyaltyProgramModal"
      :open-applied-coupons-modal="openAppliedCouponsModal"
      :open-return-sales-invoice-modal="openReturnSalesInvoiceModal"
      :open-batch-selection-modal="openBatchSelectionModal"
      :selected-item-for-batch="selectedItemForBatch"
      @add-item="addItem"
      @toggle-view="toggleView"
      @set-sinv-doc="setSinvDoc"
      @clear-values="clearValues"
      @set-customer="setCustomer"
      @toggle-modal="toggleModal"
      @set-item-group="setItemGroup"
      @handle-item-search="handleItemSearch"
      @set-paid-amount="setPaidAmount"
      @set-payment-method="setPaymentMethod"
      @set-coupons-count="setCouponsCount"
      @route-to-sinv-list="routeToSinvList"
      @set-loyalty-points="setLoyaltyPoints"
      @set-transfer-ref-no="setTransferRefNo"
      @apply-pricing-rule="applyPricingRule"
      @create-transaction="createTransaction"
      @save-invoice-action="saveInvoiceAction"
      @set-transfer-amount="setTransferAmount"
      @selected-invoice-name="selectedInvoiceName"
      @selected-return-invoice="selectedReturnInvoice"
      @set-transfer-clearance-date="setTransferClearanceDate"
      @save-and-continue="handleSaveAndContinue"
      @handle-payment-action="handlePaymentAction"
      @selected-row="setQuickQtySelectedRow"
      @batch-selected="handleBatchSelected"
    />
    <ModernPOS
      v-else
      :table-view="tableView"
      :profile="(posProfile as POSProfile)"
      :total-quantity="totalQuantity"
      :item-quantity-qap="itemQtyMap"
      :loyalty-points="loyaltyPoints"
      :open-alert-modal="openAlertModal"
      :default-customer="defaultCustomer"
      :item-search-term="itemSearchTerm"
      :selected-item-group="selectedItemGroup"
      :is-pos-shift-open="isPosShiftOpen"
      :items="(items as [] as POSItem[])"
      :sinv-doc="(sinvDoc as SalesInvoice)"
      :disable-pay-button="disablePayButton"
      :open-payment-modal="openPaymentModal"
      :open-keyboard-modal="openKeyboardModal"
      :item-discounts="(itemDiscounts as Money)"
      :coupons="(coupons as AppliedCouponCodes)"
      :open-price-list-modal="openPriceListModal"
      :open-item-enquiry-modal="openItemEnquiryModal"
      :applied-coupons-count="appliedCouponsCount"
      :open-shift-close-modal="openShiftCloseModal"
      :open-coupon-code-modal="openCouponCodeModal"
      :open-saved-invoice-modal="openSavedInvoiceModal"
      :open-loyalty-program-modal="openLoyaltyProgramModal"
      :open-applied-coupons-modal="openAppliedCouponsModal"
      :open-return-sales-invoice-modal="openReturnSalesInvoiceModal"
      :open-batch-selection-modal="openBatchSelectionModal"
      :selected-item-for-batch="selectedItemForBatch"
      @add-item="addItem"
      @toggle-view="toggleView"
      @set-sinv-doc="setSinvDoc"
      @clear-values="clearValues"
      @set-customer="setCustomer"
      @toggle-modal="toggleModal"
      @set-item-group="setItemGroup"
      @handle-item-search="handleItemSearch"
      @set-paid-amount="setPaidAmount"
      @set-payment-method="setPaymentMethod"
      @set-coupons-count="setCouponsCount"
      @route-to-sinv-list="routeToSinvList"
      @apply-pricing-rule="applyPricingRule"
      @set-loyalty-points="setLoyaltyPoints"
      @set-transfer-ref-no="setTransferRefNo"
      @create-transaction="createTransaction"
      @save-invoice-action="saveInvoiceAction"
      @set-transfer-amount="setTransferAmount"
      @selected-invoice-name="selectedInvoiceName"
      @selected-return-invoice="selectedReturnInvoice"
      @save-and-continue="handleSaveAndContinue"
      @set-transfer-clearance-date="setTransferClearanceDate"
      @selected-row="setQuickQtySelectedRow"
      @handle-payment-action="handlePaymentAction"
      @batch-selected="handleBatchSelected"
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
import { POSProfile } from 'models/baseModels/POSProfile/PosProfile';
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
  getItemRateFromPriceList,
  getItemVisibility,
} from 'models/helpers';
import {
  POSItem,
  ItemQtyMap,
  ItemSerialNumbers,
} from 'src/components/POS/types';
import { ValidationError } from 'fyo/utils/errors';

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
      paidAmount: computed(() => this.paidAmount),
      paymentMethod: computed(() => this.paymentMethod),
      transferRefNo: computed(() => this.transferRefNo),
      itemDiscounts: computed(() => this.itemDiscounts),
      transferAmount: computed(() => this.transferAmount),
      appliedCoupons: computed(() => this.sinvDoc.coupons),
      totalTaxedAmount: computed(() => this.totalTaxedAmount),
      itemSerialNumbers: computed(() => this.itemSerialNumbers),
      isDiscountingEnabled: computed(() => this.isDiscountingEnabled),
      transferClearanceDate: computed(() => this.transferClearanceDate),
      posSettings: computed(() => fyo.singles.POSSettings),
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
      openItemEnquiryModal: false,
      openCouponCodeModal: false,
      openShiftCloseModal: false,
      openSavedInvoiceModal: false,
      openLoyaltyProgramModal: false,
      openAppliedCouponsModal: false,
      openReturnSalesInvoiceModal: false,
      openBatchSelectionModal: false,

      totalQuantity: 0,
      paidAmount: fyo.pesa(0),
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
      selectedItemGroup: '',
      paymentMethod: undefined as string | undefined,
      transferRefNo: undefined as string | undefined,
      defaultCustomer: undefined as string | undefined,
      transferClearanceDate: undefined as Date | undefined,

      paymentDoc: {} as Payment,
      sinvDoc: {} as SalesInvoice,
      posProfile: {} as POSProfile,
      itemQtyMap: {} as ItemQtyMap,
      coupons: {} as AppliedCouponCodes,
      itemSerialNumbers: {} as ItemSerialNumbers,
      quickQtyActive: false,
      quickQtyBuffer: '' as string,
      quickQtyRow: null as SalesInvoiceItem | null,
      quickQtyKeyDownHandler: null as ((e: KeyboardEvent) => void) | null,
      quickQtyKeyUpHandler: null as ((e: KeyboardEvent) => void) | null,
      selectedItemForBatch: '' as string,
      pendingBatchItem: null as { item: POSItem; quantity: number } | null,
    };
  },
  computed: {
    defaultPOSCashAccount: () =>
      fyo.singles.POSSettings?.cashAccount ?? undefined,
    isDiscountingEnabled(): boolean {
      return !!fyo.singles.AccountingSettings?.enableDiscounting;
    },
    isPosShiftOpen: () => !!fyo.singles.POSSettings?.isShiftOpen,
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
    await this.loadPOSProfile();
  },
  async activated() {
    toggleSidebar(false);
    validateIsPosSettingsSet(fyo);
    this.setCouponCodeDoc();
    this.setSinvDoc();
    this.setDefaultCustomer();
    this.setShortcuts();
    this.addQuickQtyListeners();

    await this.setItemQtyMap();
    await this.setItems();
  },
  deactivated() {
    this.shortcuts?.delete(COMPONENT_NAME);
    toggleSidebar(true);
    this.removeQuickQtyListeners();
  },
  methods: {
    setQuickQtySelectedRow(row: SalesInvoiceItem) {
      this.quickQtyRow = row;
    },
    addQuickQtyListeners() {
      this.quickQtyKeyDownHandler = (e: KeyboardEvent) =>
        this.onQuickQtyKeyDown(e);
      this.quickQtyKeyUpHandler = (e: KeyboardEvent) => this.onQuickQtyKeyUp(e);
      window.addEventListener(
        'keydown',
        this.quickQtyKeyDownHandler as EventListener
      );
      window.addEventListener(
        'keyup',
        this.quickQtyKeyUpHandler as EventListener
      );
    },
    removeQuickQtyListeners() {
      if (this.quickQtyKeyDownHandler) {
        window.removeEventListener(
          'keydown',
          this.quickQtyKeyDownHandler as EventListener
        );
        this.quickQtyKeyDownHandler = null;
      }
      if (this.quickQtyKeyUpHandler) {
        window.removeEventListener(
          'keyup',
          this.quickQtyKeyUpHandler as EventListener
        );
        this.quickQtyKeyUpHandler = null;
      }
    },
    hasAnyOpenModal(): boolean {
      return (
        this.openAlertModal ||
        this.openPaymentModal ||
        this.openKeyboardModal ||
        this.openPriceListModal ||
        this.openItemEnquiryModal ||
        this.openCouponCodeModal ||
        this.openShiftCloseModal ||
        this.openSavedInvoiceModal ||
        this.openLoyaltyProgramModal ||
        this.openAppliedCouponsModal ||
        this.openReturnSalesInvoiceModal
      );
    },
    onQuickQtyKeyDown(e: KeyboardEvent) {
      // Ignore if focus is in an input/contentEditable without modifiers
      const notMods = !(e.altKey || e.metaKey || e.ctrlKey);
      const target = e.target as HTMLElement | null;
      if (
        target &&
        notMods &&
        ((target instanceof HTMLInputElement && target.type !== 'button') ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable)
      ) {
        return;
      }

      // Only active on POS page with no modal open
      if (this.hasAnyOpenModal()) {
        return;
      }

      if (e.code === 'KeyQ' && !this.quickQtyActive) {
        this.quickQtyActive = true;
        this.quickQtyBuffer = '';
        return;
      }

      if (!this.quickQtyActive) {
        return;
      }

      // While holding Q, collect digits; support both main digits and numpad
      if (/^Digit[0-9]$/.test(e.code)) {
        this.quickQtyBuffer += e.code.replace('Digit', '');
        e.preventDefault();
        return;
      }

      if (/^Numpad[0-9]$/.test(e.code)) {
        this.quickQtyBuffer += e.code.replace('Numpad', '');
        e.preventDefault();
        return;
      }

      if (e.code === 'Backspace') {
        this.quickQtyBuffer = this.quickQtyBuffer.slice(0, -1);
        e.preventDefault();
        return;
      }
    },
    async onQuickQtyKeyUp(e: KeyboardEvent) {
      if (e.code !== 'KeyQ' || !this.quickQtyActive) {
        return;
      }

      this.quickQtyActive = false;

      const buffer = this.quickQtyBuffer;
      this.quickQtyBuffer = '';

      if (!buffer || !buffer.length) {
        return;
      }

      const qty = Number(buffer);
      if (!Number.isFinite(qty)) {
        return;
      }

      // Determine target row: prefer explicitly selected row; else fallback to last non-free item
      let row = this.quickQtyRow as SalesInvoiceItem | null;
      if (!row || !(this.sinvDoc.items || []).includes(row)) {
        const items = (this.sinvDoc.items || []).filter((r) => !r.isFreeItem);
        row = items.length
          ? (items[items.length - 1] as SalesInvoiceItem)
          : null;
      }

      if (!row) {
        return;
      }

      // Validate and recalculate similar to keyboard modal quantity change
      const prevQty = row.quantity ?? 1;

      if (!row.isReturn && qty <= 0) {
        showToast({
          type: 'error',
          message: t`Quantity must be greater than zero.`,
          duration: 'short',
        });
        return;
      }

      try {
        await row.set('quantity', qty);

        const existingItems = (this.sinvDoc.items || []).filter(
          (invoiceItem) =>
            (invoiceItem as InvoiceItem).item === row!.item &&
            !(invoiceItem as InvoiceItem).isFreeItem
        ) as InvoiceItem[];

        await validateQty(
          this.sinvDoc as SalesInvoice,
          row,
          existingItems as unknown as InvoiceItem[]
        );
      } catch (error) {
        await row.set('quantity', prevQty);
        showToast({
          type: 'error',
          message: t`${error as string}`,
          duration: 'short',
        });
        return;
      }

      if (!row.isFreeItem) {
        await this.applyPricingRule();
        await this.sinvDoc.runFormulas();
      }
    },
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

    async loadPOSProfile() {
      const posProfileName = fyo.singles.POSSettings?.posProfile;

      if (!posProfileName) {
        return;
      }

      this.posProfile = (await fyo.doc.getDoc(
        ModelNameEnum.POSProfile,
        posProfileName as string
      )) as POSProfile;
    },

    async handleItemSearch(searchTerm: string, addItem?: boolean) {
      this.itemSearchTerm = searchTerm;
      if (!addItem) return;

      let quantity = 1;
      const posSettings = fyo.singles.POSSettings;
      const isWeightEnabledBarcode = posSettings?.weightEnabledBarcode;

      const checkDigits = posSettings?.checkDigits || '';
      const itemCodeDigits = posSettings?.itemCodeDigits || 0;
      const weightDigits = posSettings?.itemWeightDigits || 0;

      const expectedWeightBarcodeLength =
        String(checkDigits).length +
        Number(itemCodeDigits) +
        Number(weightDigits);

      let isWeightBarcode = false;
      let itemCode = searchTerm;
      let weightPart = '';

      if (
        isWeightEnabledBarcode &&
        searchTerm.length === expectedWeightBarcodeLength
      ) {
        const extractedItemCode = searchTerm.slice(
          checkDigits.toString().length,
          checkDigits.toString().length + itemCodeDigits
        );
        const weightData = searchTerm.slice(
          checkDigits.toString().length + itemCodeDigits
        );

        if (!isNaN(Number(weightData))) {
          isWeightBarcode = true;
          itemCode = extractedItemCode;
          weightPart = weightData;
        }
      }

      const allItems = await this.fyo.db.getAll(ModelNameEnum.Item, {
        fields: ['name', 'barcode', 'itemCode', 'unit'],
      });

      let matchedItem = null;

      if (isWeightBarcode) {
        matchedItem = allItems.find(
          (item) => item.itemCode === itemCode || item.barcode === itemCode
        );
      } else if (searchTerm.length === 12) {
        matchedItem = allItems.find((item) => item.barcode === searchTerm);
      }

      if (!matchedItem) {
        matchedItem = allItems.find((item) => item.name === searchTerm);
      }

      if (!matchedItem) return;

      if (isWeightBarcode && weightPart) {
        const weightValue = parseInt(weightPart, 10);
        if ((matchedItem.unit as string)?.toLowerCase() === 'kg') {
          quantity = weightValue / 1000;
        } else {
          quantity = weightValue;
        }
      }

      const itemDoc = this.getItem(matchedItem.name as string);
      if (itemDoc && addItem) {
        await this.addItem(itemDoc as POSItem, quantity);
        this.itemSearchTerm = '';
      }
    },

    getItem(name: string) {
      return this.items.find((item) => item.name === name);
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
    async setItemGroup(itemGroupName: string) {
      this.selectedItemGroup = itemGroupName;
      await this.setItems();
    },
    async setItems() {
      const filters: Record<string, boolean | string> = {};
      const itemVisibility = await getItemVisibility(this.fyo);

      const hideUnavailable =
        this.posProfile?.hideUnavailableItems ??
        this.fyo.singles.POSSettings?.hideUnavailableItems;

      if (itemVisibility === 'Inventory Items') {
        filters.trackItem = true;
      } else {
        filters.trackItem = false;
      }

      if (this.selectedItemGroup) {
        filters.itemGroup = this.selectedItemGroup;
      }

      const items = (await fyo.db.getAll(ModelNameEnum.Item, {
        fields: [],
        filters: filters,
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
        if (hideUnavailable && filters.trackItem && availableQty <= 0) {
          continue;
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
    async selectedReturnInvoice(invoiceName: string) {
      const salesInvoiceDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        invoiceName
      )) as SalesInvoice;

      let returnDoc = (await salesInvoiceDoc.getReturnDoc()) as SalesInvoice;

      if (!returnDoc || !returnDoc.name) {
        return;
      }

      this.sinvDoc = returnDoc;
    },
    toggleView() {
      this.tableView = !this.tableView;
    },
    setPaidAmount(amount: Money) {
      this.paidAmount = this.fyo.pesa(amount.toString());
    },
    setPaymentMethod(method: string) {
      this.paymentMethod = method;
    },
    setDefaultCustomer() {
      this.defaultCustomer =
        this.posProfile?.posCustomer ??
        this.fyo.singles.Defaults?.posCustomer ??
        '';
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
        account: this.fyo.singles.POSSettings?.defaultAccount,
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
    ignorePricingRules(): boolean {
      if (this.posProfile) {
        return this.posProfile.ignorePricingRule as boolean;
      }

      return !!this.fyo.singles.POSSettings?.ignorePricingRule;
    },
    setTotalTaxedAmount() {
      this.totalTaxedAmount = getTotalTaxedAmount(this.sinvDoc as SalesInvoice);
    },
    setCouponsCount(value: number) {
      this.appliedCouponsCount = value;
    },
    async setLoyaltyPoints(value: number) {
      this.appliedLoyaltyPoints = value;
      await this.sinvDoc.set('redeemLoyaltyPoints', true);
      await this.sinvDoc.runFormulas();
    },
    async selectedInvoiceName(doc: SalesInvoice) {
      const salesInvoiceDoc = (await this.fyo.doc.getDoc(
        ModelNameEnum.SalesInvoice,
        doc.name
      )) as SalesInvoice;

      this.sinvDoc = salesInvoiceDoc;
      this.toggleModal('SavedInvoice', false);

      if (doc.submitted) {
        this.toggleModal('Payment');
      }
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
    validateInvoice() {
      if (this.sinvDoc.isSubmitted) {
        throw new ValidationError(
          t`Cannot add an item to a submitted invoice.`
        );
      }

      if (this.sinvDoc.returnAgainst) {
        throw new ValidationError(
          t`Unable to add an item to the return invoice.`
        );
      }
    },
    async addItem(item: POSItem | undefined, quantity?: number) {
      try {
        await this.sinvDoc.runFormulas();
        this.validateInvoice();

        if (!item) {
          return;
        }

        if (item.hasBatch) {
          this.selectedItemForBatch = item.name;
          this.pendingBatchItem = { item, quantity: quantity ?? 1 };

          this.toggleModal('BatchSelection', true);

          return;
        }

        const isInventoryItem = await this.fyo.getValue(
          ModelNameEnum.Item,
          item.name,
          'trackItem'
        );

        if (isInventoryItem) {
          const availableQty = this.itemQtyMap[item.name]?.availableQty ?? 0;
          if (availableQty <= 0) {
            throw new ValidationError(
              t`Item  is out of stock (quantity is zero)`
            );
          }
        }

        const existingItems =
          this.sinvDoc.items?.filter(
            (invoiceItem) =>
              invoiceItem.item === item.name && !invoiceItem.isFreeItem
          ) ?? [];

        await validateQty(
          this.sinvDoc as SalesInvoice,
          item,
          existingItems as InvoiceItem[]
        );

        const itemsHsncode = (await this.fyo.getValue(
          'Item',
          item?.name,
          'hsnCode'
        )) as number;

        if (item.hasBatch) {
          const addQty = quantity ?? 1;

          if (existingItems.length > 0) {
            for (let item of existingItems) {
              const availableQty = await fyo.db.getStockQuantity(
                item.item as string,
                undefined,
                undefined,
                undefined,
                item.batch
              );
              if (
                item.batch != null &&
                availableQty != null &&
                availableQty > (item.quantity as number)
              ) {
                const currentQty = item.quantity ?? 0;
                await item.set('quantity', currentQty + addQty);
                await this.applyPricingRule();
                await this.sinvDoc.runFormulas();
                return;
              }
            }
          }

          await this.sinvDoc.append('items', {
            rate: item.rate,
            item: item.name,
            quantity: addQty,
            hsnCode: itemsHsncode,
          });
          await this.applyPricingRule();
          await this.sinvDoc.runFormulas();
          return;
        }

        if (existingItems.length) {
          if (!this.sinvDoc.priceList) {
            existingItems[0].rate = item.rate;
          }

          const currentQty = existingItems[0].quantity ?? 0;
          const addQty = quantity ?? 1;
          if (isInventoryItem) {
            const availableQty = this.itemQtyMap[item.name]?.availableQty ?? 0;
            if (currentQty + addQty > availableQty) {
              throw new ValidationError(
                'Cannot add more than the available quantity'
              );
            }
          }

          await existingItems[0].set('quantity', currentQty + addQty);
          await this.applyPricingRule();
          await this.sinvDoc.runFormulas();
          if (isInventoryItem) {
            await validateQty(
              this.sinvDoc as SalesInvoice,
              item,
              existingItems as InvoiceItem[]
            );
          }
          return;
        }

        await this.sinvDoc.append('items', {
          rate: item.rate,
          item: item.name,
          quantity: quantity ? quantity : 1,
          hsnCode: itemsHsncode,
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
      } catch (error) {
        return showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async handleBatchSelected(batchName: string) {
      if (!this.pendingBatchItem) {
        return;
      }

      const { item, quantity } = this.pendingBatchItem;
      this.pendingBatchItem = null;

      try {
        const itemDoc = (await this.fyo.doc.getDoc(
          ModelNameEnum.Item,
          item.name
        )) as Item;
        let availableQty = 0;
        if (itemDoc.trackItem) {
          availableQty =
            (await fyo.db.getStockQuantity(
              item.name,
              undefined,
              undefined,
              undefined,
              batchName
            )) ?? 0;

          const itemIndex = this.items.findIndex((i) => i.name === item.name);
          if (itemIndex !== -1) {
            this.items[itemIndex].availableQty = availableQty ?? 0;
          }
        }

        const existingItems =
          this.sinvDoc.items?.filter(
            (invoiceItem) =>
              invoiceItem.item === item.name &&
              invoiceItem.batch === batchName &&
              !invoiceItem.isFreeItem
          ) ?? [];

        await validateQty(
          this.sinvDoc as SalesInvoice,
          itemDoc,
          existingItems as InvoiceItem[]
        );

        if (existingItems.length) {
          const currentQty = existingItems[0].quantity ?? 0;
          const addQty = quantity ?? 1;
          await existingItems[0].set('quantity', currentQty + addQty);
        } else {
          await this.sinvDoc.append('items', {
            rate: item.rate as Money,
            item: item.name,
            quantity: quantity ?? 1,
            hsnCode: itemDoc.hsnCode,
            batch: batchName,
          });
        }

        await this.applyPricingRule();
        await this.sinvDoc.runFormulas();

        await this.setItemQtyMap();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },

    async createTransaction(shouldPrint = false, isPay = false) {
      try {
        this.sinvDoc.date = new Date();
        await this.validate();
        await this.submitSinvDoc();

        const itemVisibility = await getItemVisibility(this.fyo);

        if (
          this.sinvDoc.stockNotTransferred &&
          itemVisibility === 'Inventory Items'
        ) {
          await this.makeStockTransfer();
        }

        if (isPay) {
          await this.makePayment(shouldPrint);
        }

        if (shouldPrint) {
          await routeTo(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `/print/${this.sinvDoc.schemaName}/${this.sinvDoc.name}`
          );
        }

        await this.afterTransaction();
        await this.setItems();
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    async makePayment(shouldPrint: boolean) {
      this.paymentDoc = this.sinvDoc.getPayment() as Payment;
      if (!this.paymentDoc) {
        return null;
      }

      const paymentMethod = this.paymentMethod;

      await this.paymentDoc.set('paymentMethod', paymentMethod);
      await this.paymentDoc.set('amount', this.fyo.pesa(this.paidAmount.float));
      await this.paymentDoc.set('referenceType', ModelNameEnum.SalesInvoice);

      const paymentMethodDoc = await this.paymentDoc.loadAndGetLink(
        'paymentMethod'
      );

      if (paymentMethodDoc?.type !== 'Cash') {
        await this.paymentDoc.setMultiple({
          referenceId: this.transferRefNo,
          clearanceDate: this.transferClearanceDate,
        });
      }

      if (paymentMethodDoc?.type === 'Cash') {
        await this.paymentDoc.setMultiple({
          paymentAccount: this.defaultPOSCashAccount,
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

        if (shouldPrint) {
          await routeTo(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `/print/${this.sinvDoc.schemaName}/${this.sinvDoc.name}`
          );
        }
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
        const trackItem = await fyo.getValue(
          ModelNameEnum.Item,
          item.item as string,
          'trackItem'
        );

        if (!trackItem) {
          continue;
        }

        if (this.posProfile) {
          item.location = this.posProfile.inventory;
        } else {
          item.location = fyo.singles.POSSettings?.inventory;
        }

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
    async submitSinvDoc() {
      this.sinvDoc.once('afterSubmit', () => {
        showToast({
          type: 'success',
          message: t`Sales Invoice ${this.sinvDoc.name as string} is Submitted`,
          duration: 'short',
        });
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
      if (this.sinvDoc.isSubmitted) {
        await this.clearValues();
        this.setSinvDoc();
      }
      this.toggleModal('Payment', false);
    },
    async clearValues() {
      this.setSinvDoc();
      this.itemSerialNumbers = {};

      this.paidAmount = fyo.pesa(0);
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
      await validateSinv(this.sinvDoc as SalesInvoice, this.itemQtyMap);

      if (!this.sinvDoc.isReturn) {
        await validateShipment(this.itemSerialNumbers);
      }
    },
    async applyPricingRule() {
      if (this.ignorePricingRules()) {
        return;
      }
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

      const outOfStockFreeItems: string[] = [];
      const itemQtyMap = await getItemQtyMap(this.sinvDoc as SalesInvoice);

      hasPricingRules.map((pRule) => {
        const freeItemQty =
          itemQtyMap[pRule.pricingRule.freeItem as string]?.availableQty;

        if (freeItemQty <= 0) {
          this.sinvDoc.items = this.sinvDoc.items?.filter(
            (val) => !(val.isFreeItem && val.item == pRule.pricingRule.freeItem)
          );

          outOfStockFreeItems.push(pRule.pricingRule.freeItem as string);
        }
      });

      if (!outOfStockFreeItems.length) {
        return;
      }

      showToast({
        type: 'error',
        message: t`Free items out of stock: ${outOfStockFreeItems.join(', ')}`,
      });
    },
    async routeToSinvList() {
      if (!this.sinvDoc.items?.length) {
        return await routeTo('/list/SalesInvoice');
      }

      this.openAlertModal = true;
    },
    async handleSaveAndContinue() {
      try {
        if (!this.sinvDoc.party) {
          return showToast({
            type: 'error',
            message: t`Please add a customer before saving`,
          });
        }
        await this.saveInvoiceAction();
        this.toggleModal('Alert', false);
        await this.routeTo('/list/SalesInvoice');
      } catch (error) {
        showToast({
          type: 'error',
          message: t`${error as string}`,
        });
      }
    },
    showValidationToast(method: string) {
      showToast({
        type: 'error',
        message: t`${
          !this.sinvDoc.items?.length
            ? 'Please add items'
            : 'Please select a customer'
        } before ${method}`,
      });
    },

    async saveInvoiceAction() {
      if (!this.sinvDoc.items?.length || !this.sinvDoc.party) {
        this.showValidationToast('saving');
        return;
      }
      await this.saveOrder();
    },
    handlePaymentAction() {
      if (!this.sinvDoc.items?.length || !this.sinvDoc.party) {
        this.showValidationToast('payment');
        return;
      }

      this.toggleModal('Payment', true);
    },
    routeTo,
  },
});
</script>
