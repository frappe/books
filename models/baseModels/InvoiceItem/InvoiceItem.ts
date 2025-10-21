import { Fyo, t } from 'fyo';
import { DocValue, DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  CurrenciesMap,
  FiltersMap,
  FormulaMap,
  HiddenMap,
  ValidationMap,
} from 'fyo/model/types';
import { DEFAULT_CURRENCY } from 'fyo/utils/consts';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { FieldTypeEnum, Schema } from 'schemas/types';
import { safeParseFloat } from 'utils/index';
import { Invoice } from '../Invoice/Invoice';
import { Item } from '../Item/Item';
import { StockTransfer } from 'models/inventory/StockTransfer';
import { isPesa } from 'fyo/utils';
import { PricingRule } from '../PricingRule/PricingRule';
import { getItemRateFromPriceList, getPricingRule } from 'models/helpers';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { QueryFilter } from 'utils/db/types';

export abstract class InvoiceItem extends Doc {
  item?: string;
  account?: string;
  amount?: Money;
  parentdoc?: Invoice;
  rate?: Money;

  description?: string;
  hsnCode?: number;

  unit?: string;
  transferUnit?: string;
  quantity?: number;
  transferQuantity?: number;
  unitConversionFactor?: number;
  batch?: string;

  tax?: string;
  stockNotTransferred?: number;

  setItemDiscountAmount?: boolean;
  itemDiscountAmount?: Money;
  itemDiscountPercent?: number;
  itemDiscountedTotal?: Money;
  itemTaxedTotal?: Money;

  isFreeItem?: boolean;

  get isSales() {
    return (
      this.schemaName === 'SalesInvoiceItem' ||
      this.schemaName === 'SalesQuoteItem'
    );
  }

  get date() {
    return this.parentdoc?.date ?? undefined;
  }

  get party() {
    return this.parentdoc?.party ?? undefined;
  }

  get priceList() {
    return this.parentdoc?.priceList ?? undefined;
  }

  get discountAfterTax() {
    return !!this?.parentdoc?.discountAfterTax;
  }

  get enableDiscounting() {
    return !!this.fyo.singles?.AccountingSettings?.enableDiscounting;
  }

  get enableInventory() {
    return !!this.fyo.singles?.AccountingSettings?.enableInventory;
  }

  get currency() {
    return this.parentdoc?.currency ?? DEFAULT_CURRENCY;
  }

  get exchangeRate() {
    return this.parentdoc?.exchangeRate ?? 1;
  }

  get isMultiCurrency() {
    return this.parentdoc?.isMultiCurrency ?? false;
  }

  get isReturn() {
    return !!this.parentdoc?.isReturn;
  }

  get pricingRuleDetail() {
    return this.parentdoc?.pricingRuleDetail;
  }

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);
    this._setGetCurrencies();
  }

  async getTotalTaxRate(): Promise<number> {
    if (!this.tax) {
      return 0;
    }

    const details =
      ((await this.fyo.getValue('Tax', this.tax, 'details')) as Doc[]) ?? [];
    return details.reduce((acc, doc) => {
      return (doc.rate as number) + acc;
    }, 0);
  }

  formulas: FormulaMap = {
    description: {
      formula: async () =>
        (await this.fyo.getValue(
          'Item',
          this.item as string,
          'description'
        )) as string,
      dependsOn: ['item'],
    },
    itemCode: {
      formula: async () =>
        (await this.fyo.getValue(
          'Item',
          this.item as string,
          'itemCode'
        )) as string,
      dependsOn: ['item'],
    },
    rate: {
      formula: async (fieldname) => {
        const rate = await getItemRate(this);
        if (!rate?.float && this.rate?.float) {
          return this.rate;
        }

        if (
          fieldname !== 'itemTaxedTotal' &&
          fieldname !== 'itemDiscountedTotal'
        ) {
          return rate?.div(this.exchangeRate) ?? this.fyo.pesa(0);
        }

        const quantity = this.quantity ?? 0;
        const itemDiscountPercent = this.itemDiscountPercent ?? 0;
        const itemDiscountAmount = this.itemDiscountAmount ?? this.fyo.pesa(0);
        const totalTaxRate = await this.getTotalTaxRate();
        const itemTaxedTotal = this.itemTaxedTotal ?? this.fyo.pesa(0);
        const itemDiscountedTotal =
          this.itemDiscountedTotal ?? this.fyo.pesa(0);
        const isItemTaxedTotal = fieldname === 'itemTaxedTotal';
        const discountAfterTax = this.discountAfterTax;
        const setItemDiscountAmount = !!this.setItemDiscountAmount;

        const rateFromTotals = getRate(
          quantity,
          itemDiscountPercent,
          itemDiscountAmount,
          totalTaxRate,
          itemTaxedTotal,
          itemDiscountedTotal,
          isItemTaxedTotal,
          discountAfterTax,
          setItemDiscountAmount
        );

        return rateFromTotals ?? rate ?? this.fyo.pesa(0);
      },
      dependsOn: [
        'date',
        'priceList',
        'batch',
        'party',
        'exchangeRate',
        'item',
        'quantity',
        'itemTaxedTotal',
        'itemDiscountedTotal',
        'setItemDiscountAmount',
        'pricingRuleDetail',
      ],
    },
    unit: {
      formula: async () =>
        (await this.fyo.getValue(
          'Item',
          this.item as string,
          'unit'
        )) as string,
      dependsOn: ['item'],
    },
    transferUnit: {
      formula: async (fieldname) => {
        if (!this.item) {
          return;
        }
        if (fieldname === 'quantity' || fieldname === 'unit') {
          return this.unit;
        }

        const conversionItems = await this.fyo.db.getAll(
          ModelNameEnum.UOMConversionItem,
          {
            fields: ['uom'],
            filters: { parent: this.item },
          }
        );

        if (conversionItems.length) {
          return this.unit;
        }

        const validUnits = conversionItems.map((i) => i.uom);
        if (this.transferUnit && validUnits.includes(this.transferUnit)) {
          return this.transferUnit;
        }

        return this.unit;
      },
      dependsOn: ['item', 'unit'],
    },
    transferQuantity: {
      formula: (fieldname) => {
        if (fieldname === 'quantity' || this.unit === this.transferUnit) {
          return this.quantity;
        }

        return this.transferQuantity;
      },
      dependsOn: ['item', 'quantity'],
    },
    quantity: {
      formula: async (fieldname) => {
        if (!this.item) {
          return this.quantity as number;
        }

        const itemDoc = await this.fyo.doc.getDoc(
          ModelNameEnum.Item,
          this.item
        );
        const unitDoc = itemDoc.getLink('uom');

        let quantity: number = this.quantity ?? 1;

        if (this.isReturn && quantity > 0) {
          quantity *= -1;
        }

        if (!this.isReturn && quantity < 0) {
          quantity *= -1;
        }

        if (fieldname === 'transferQuantity') {
          quantity = this.transferQuantity! * this.unitConversionFactor!;
        }

        if (unitDoc?.isWhole) {
          return Math.round(quantity);
        }

        return safeParseFloat(quantity);
      },
      dependsOn: [
        'quantity',
        'transferQuantity',
        'transferUnit',
        'unitConversionFactor',
        'item',
        'isReturn',
      ],
    },
    unitConversionFactor: {
      formula: async () => {
        if (this.unit === this.transferUnit) {
          this.quantity = this.transferQuantity!;
          return 1;
        }

        const conversionItems = await this.fyo.db.getAll(
          ModelNameEnum.UOMConversionItem,
          {
            fields: ['conversionFactor', 'uom'],
            filters: { parent: this.item!, uom: this.transferUnit as string },
          }
        );

        this.quantity =
          (conversionItems[0]?.conversionFactor as number) *
          this.transferQuantity!;

        return safeParseFloat(conversionItems[0]?.conversionFactor ?? 0);
      },
      dependsOn: ['transferUnit'],
    },
    account: {
      formula: () => {
        let accountType = 'expenseAccount';
        if (this.isSales) {
          accountType = 'incomeAccount';
        }
        return this.fyo.getValue('Item', this.item as string, accountType);
      },
      dependsOn: ['item'],
    },
    tax: {
      formula: async () => {
        const itemTax = (await this.fyo.getValue(
          'Item',
          this.item as string,
          'tax'
        )) as string;

        if (itemTax) {
          return itemTax;
        }

        const itemGroup = (await this.fyo.getValue(
          'Item',
          this.item as string,
          'itemGroup'
        )) as string;

        if (!itemGroup) {
          return '';
        }

        const itemGroupDoc = await this.fyo.doc.getDoc('ItemGroup', itemGroup);

        return itemGroupDoc?.tax as string;
      },
      dependsOn: ['item'],
    },
    amount: {
      formula: () => (this.rate as Money).mul(this.quantity as number),
      dependsOn: ['item', 'rate', 'quantity'],
    },
    hsnCode: {
      formula: async () =>
        await this.fyo.getValue('Item', this.item as string, 'hsnCode'),
      dependsOn: ['item'],
    },
    itemDiscountedTotal: {
      formula: async () => {
        const totalTaxRate = await this.getTotalTaxRate();
        const rate = this.rate ?? this.fyo.pesa(0);
        const quantity = this.quantity ?? 1;
        const itemDiscountAmount = this.itemDiscountAmount ?? this.fyo.pesa(0);
        const itemDiscountPercent = this.itemDiscountPercent ?? 0;

        if (this.setItemDiscountAmount && this.itemDiscountAmount?.isZero()) {
          return rate.mul(quantity);
        }

        if (!this.setItemDiscountAmount && this.itemDiscountPercent === 0) {
          return rate.mul(quantity);
        }

        if (!this.discountAfterTax) {
          return getDiscountedTotalBeforeTaxation(
            rate,
            quantity,
            itemDiscountAmount,
            itemDiscountPercent,
            !!this.setItemDiscountAmount
          );
        }

        return getDiscountedTotalAfterTaxation(
          totalTaxRate,
          rate,
          quantity,
          itemDiscountAmount,
          itemDiscountPercent,
          !!this.setItemDiscountAmount
        );
      },
      dependsOn: [
        'itemDiscountAmount',
        'itemDiscountPercent',
        'itemTaxedTotal',
        'setItemDiscountAmount',
        'tax',
        'rate',
        'quantity',
        'item',
      ],
    },
    itemTaxedTotal: {
      formula: async () => {
        const totalTaxRate = await this.getTotalTaxRate();
        const rate = this.rate ?? this.fyo.pesa(0);
        const quantity = this.quantity ?? 1;
        const itemDiscountAmount = this.itemDiscountAmount ?? this.fyo.pesa(0);
        const itemDiscountPercent = this.itemDiscountPercent ?? 0;

        if (!this.discountAfterTax) {
          return getTaxedTotalAfterDiscounting(
            totalTaxRate,
            rate,
            quantity,
            itemDiscountAmount,
            itemDiscountPercent,
            !!this.setItemDiscountAmount
          );
        }

        return getTaxedTotalBeforeDiscounting(totalTaxRate, rate, quantity);
      },
      dependsOn: ['rate', 'quantity', 'item'],
    },
    stockNotTransferred: {
      formula: async () => {
        if (this.parentdoc?.isSubmitted) {
          return;
        }

        const item = (await this.loadAndGetLink('item')) as Item;
        if (!item.trackItem) {
          return 0;
        }

        const { backReference, stockTransferSchemaName } = this.parentdoc ?? {};
        if (
          !backReference ||
          !stockTransferSchemaName ||
          typeof this.quantity !== 'number'
        ) {
          return this.quantity;
        }

        const refdoc = (await this.fyo.doc.getDoc(
          stockTransferSchemaName,
          backReference
        )) as StockTransfer;

        const transferred =
          refdoc.items
            ?.filter((i) => i.item === this.item)
            .reduce((acc, i) => i.quantity ?? 0 + acc, 0) ?? 0;

        return Math.max(0, this.quantity - transferred);
      },
      dependsOn: ['item', 'quantity'],
    },
    setItemDiscountAmount: {
      formula: async () => {
        if (!this.fyo.singles.AccountingSettings?.enablePricingRule) {
          return this.setItemDiscountAmount;
        }

        const hasPricingRule = this.parentdoc?.pricingRuleDetail?.some(
          (rule) => rule.referenceItem === this.item
        );

        if (!hasPricingRule && (this.itemDiscountAmount as Money).isZero()) {
          return false;
        }

        const applicablePricingRules = await getPricingRule(
          this.parentdoc as SalesInvoice
        );

        const itemRule = applicablePricingRules?.find(
          (rule) => rule.applyOnItem === this.item
        );

        if (!itemRule) {
          if (!this.prule) {
            await this.set('itemDiscountAmount', this.itemDiscountAmount);
            return true;
          } else {
            await this.set('itemDiscountAmount', this.fyo.pesa(0));
          }
          return false;
        }
        this.prule = itemRule;

        const pricingRuleDoc = itemRule.pricingRule;

        if (pricingRuleDoc.priceDiscountType === 'amount') {
          const discountAmount =
            pricingRuleDoc.discountAmount ?? this.fyo.pesa(0);
          await this.set('itemDiscountAmount', discountAmount);
          return true;
        }

        return false;
      },
      dependsOn: ['pricingRuleDetail', 'quantity', 'item'],
    },
    itemDiscountPercent: {
      formula: async () => {
        if (!this.fyo.singles.AccountingSettings?.enablePricingRule) {
          return this.itemDiscountPercent ?? 0;
        }

        const pricingRule = this.parentdoc?.pricingRuleDetail?.filter(
          (prDetail) => prDetail.referenceItem === this.item
        );

        if (!pricingRule || !pricingRule.length) {
          if (!this.prule) {
            return this.itemDiscountPercent;
          } else {
            return 0;
          }
        }

        const pricingRuleDoc = (await this.fyo.doc.getDoc(
          ModelNameEnum.PricingRule,
          pricingRule[0].referenceName
        )) as PricingRule;

        if (pricingRuleDoc.discountType === 'Product Discount') {
          return this.itemDiscountPercent ?? 0;
        }

        if (pricingRuleDoc.priceDiscountType === 'percentage') {
          await this.set('setItemDiscountAmount', false);
          return pricingRuleDoc.discountPercentage ?? 0;
        }

        return this.itemDiscountPercent ?? 0;
      },
      dependsOn: ['pricingRuleDetail', 'item'],
    },
  };

  validations: ValidationMap = {
    rate: (value: DocValue) => {
      if ((value as Money).gte(0)) {
        return;
      }

      throw new ValidationError(
        this.fyo.t`Rate (${this.fyo.format(
          value,
          'Currency'
        )}) cannot be less zero.`
      );
    },
    itemDiscountAmount: (value: DocValue) => {
      if ((value as Money).lte(this.amount!)) {
        return;
      }

      throw new ValidationError(
        this.fyo.t`Discount Amount (${this.fyo.format(
          value,
          'Currency'
        )}) cannot be greated than Amount (${this.fyo.format(
          this.amount!,
          'Currency'
        )}).`
      );
    },
    itemDiscountPercent: (value: DocValue) => {
      if ((value as number) < 100) {
        return;
      }

      throw new ValidationError(
        this.fyo.t`Discount Percent (${
          value as number
        }) cannot be greater than 100.`
      );
    },
    transferUnit: async (value: DocValue) => {
      if (!this.item) {
        return;
      }

      if (value === this.unit) {
        return;
      }

      const item = await this.fyo.db.getAll(ModelNameEnum.UOMConversionItem, {
        fields: ['parent'],
        filters: { uom: value as string, parent: this.item },
      });

      if (item.length < 1)
        throw new ValidationError(
          t`Transfer Unit ${value as string} is not applicable for Item ${
            this.item
          }`
        );
    },
  };

  hidden: HiddenMap = {
    itemDiscountedTotal: () => {
      if (!this.enableDiscounting) {
        return true;
      }

      if (!!this.setItemDiscountAmount && this.itemDiscountAmount?.isZero()) {
        return true;
      }

      if (!this.setItemDiscountAmount && this.itemDiscountPercent === 0) {
        return true;
      }

      return false;
    },
    setItemDiscountAmount: () => !this.enableDiscounting,
    itemDiscountAmount: () =>
      !(this.enableDiscounting && !!this.setItemDiscountAmount),
    itemDiscountPercent: () =>
      !(this.enableDiscounting && !this.setItemDiscountAmount),
    batch: () => !this.fyo.singles.InventorySettings?.enableBatches,
    transferUnit: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
    transferQuantity: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
    unitConversionFactor: () =>
      !this.fyo.singles.InventorySettings?.enableUomConversions,
  };

  static filters: FiltersMap = {
    item: (doc: Doc) => {
      let itemNotFor = 'Sales';
      if (doc.isSales) {
        itemNotFor = 'Purchases';
      }

      const baseFilter: QueryFilter = {
        for: ['not in', [itemNotFor]],
      };

      const accountingSettings = doc.fyo.singles?.AccountingSettings;
      const inventorySettings = doc.fyo.singles?.InventorySettings;

      if (accountingSettings?.enablePointOfSaleWithOutInventory) {
        const posSettings = doc.fyo.singles?.POSSettings;

        const posItemVisibility = posSettings?.itemVisibility;

        if (posItemVisibility === 'Inventory Items') {
          return { ...baseFilter, trackItem: true };
        }

        if (posItemVisibility === 'Non-Inventory Items') {
          return { ...baseFilter, trackItem: false };
        }

        return baseFilter;
      }

      const invItemVisibility = inventorySettings?.itemVisibility;

      if (invItemVisibility) {
        return { ...baseFilter, trackItem: true };
      } else {
        return { ...baseFilter, trackItem: false };
      }

      return baseFilter;
    },
    batch: async (doc: Doc) => {
      const batches = await doc.fyo.db.getAll(ModelNameEnum.Batch, {
        fields: ['name'],
        filters: { item: doc.item as string },
      });
      const batchName = batches.map((b) => b.name) as string[];

      return {
        name: ['in', batchName],
      };
    },
    transferUnit: async (doc: Doc) => {
      const conversionItems = await doc.fyo.db.getAll(
        ModelNameEnum.UOMConversionItem,
        {
          fields: ['uom'],
          filters: { parent: doc.item as string },
        }
      );
      const conversionUoms = conversionItems.map((i) => i.uom) as string[];

      const baseUnit = await doc.fyo.getValue(
        ModelNameEnum.Item,
        doc.item as string,
        'unit'
      );
      const validUoms = [...conversionUoms, baseUnit].filter(
        Boolean
      ) as string[];

      return {
        name: ['in', validUoms],
      };
    },
  };

  static createFilters: FiltersMap = {
    item: (doc: Doc) => {
      return { for: doc.isSales ? 'Sales' : 'Purchases' };
    },
  };

  getCurrencies: CurrenciesMap = {};
  _getCurrency() {
    if (this.exchangeRate === 1) {
      return this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY;
    }

    return this.currency;
  }
  _setGetCurrencies() {
    const currencyFields = this.schema.fields.filter(
      ({ fieldtype }) => fieldtype === FieldTypeEnum.Currency
    );

    for (const { fieldname } of currencyFields) {
      this.getCurrencies[fieldname] ??= this._getCurrency.bind(this);
    }
  }
}

async function getItemRate(doc: InvoiceItem): Promise<Money | undefined> {
  if (doc.isFreeItem) {
    return doc.rate;
  }

  let pricingRuleRate: Money | undefined;
  if (doc.fyo.singles.AccountingSettings?.enablePricingRule) {
    pricingRuleRate = await getItemRateFromPricingRule(doc);
  }

  if (pricingRuleRate) {
    return pricingRuleRate;
  }

  let priceListRate: Money | undefined;

  if (doc.fyo.singles.AccountingSettings?.enablePriceList) {
    priceListRate = await getItemRateFromPriceList(
      doc,
      doc.parentdoc?.priceList as string
    );
  }

  if (priceListRate) {
    return priceListRate;
  }

  if (!doc.item) {
    return;
  }

  const itemRate = await doc.fyo.getValue(ModelNameEnum.Item, doc.item, 'rate');
  if (isPesa(itemRate)) {
    return itemRate;
  }

  return;
}

async function getItemRateFromPricingRule(
  doc: InvoiceItem
): Promise<Money | undefined> {
  const pricingRule = doc.parentdoc?.pricingRuleDetail?.filter(
    (prDetail) => prDetail.referenceItem === doc.item
  );

  if (!pricingRule || !pricingRule.length) {
    return;
  }

  const pricingRuleDoc = (await doc.fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    pricingRule[0].referenceName
  )) as PricingRule;

  if (pricingRuleDoc.discountType !== 'Price Discount') {
    return;
  }

  if (pricingRuleDoc.priceDiscountType !== 'rate') {
    return;
  }

  return pricingRuleDoc.discountRate;
}

function getDiscountedTotalBeforeTaxation(
  rate: Money,
  quantity: number,
  itemDiscountAmount: Money,
  itemDiscountPercent: number,
  setDiscountAmount: boolean
) {
  /**
   * If Discount is applied before taxation
   * Use different formulas depending on how discount is set
   * - if amount : Quantity * Rate - DiscountAmount
   * - if percent: Quantity * Rate (1 - DiscountPercent / 100)
   */

  if (setDiscountAmount) {
    return rate.sub(itemDiscountAmount).mul(quantity);
  } else if (itemDiscountPercent > 0) {
    return rate.mul(quantity).percent(itemDiscountPercent);
  }
  return rate.mul(quantity);
}

function getTaxedTotalAfterDiscounting(
  totalTaxRate: number,
  rate: Money,
  quantity: number,
  itemDiscountAmount: Money,
  itemDiscountPercent: number,
  setItemDiscountAmount: boolean
) {
  /**
   * If Discount is applied before taxation
   * Formula: Discounted Total * (1 + TotalTaxRate / 100)
   */

  const discountedTotal = getDiscountedTotalBeforeTaxation(
    rate,
    quantity,
    itemDiscountAmount,
    itemDiscountPercent,
    setItemDiscountAmount
  );

  return discountedTotal.mul(1 + totalTaxRate / 100);
}

function getDiscountedTotalAfterTaxation(
  totalTaxRate: number,
  rate: Money,
  quantity: number,
  itemDiscountAmount: Money,
  itemDiscountPercent: number,
  setItemDiscountAmount: boolean
) {
  /**
   * If Discount is applied after taxation
   * Use different formulas depending on how discount is set
   * - if amount : Taxed Total - Discount Amount
   * - if percent: Taxed Total * (1 - Discount Percent / 100)
   */
  const taxedTotal = getTaxedTotalBeforeDiscounting(
    totalTaxRate,
    rate,
    quantity
  );

  if (setItemDiscountAmount) {
    return taxedTotal.sub(itemDiscountAmount);
  }

  return taxedTotal.mul(1 - itemDiscountPercent / 100);
}

function getTaxedTotalBeforeDiscounting(
  totalTaxRate: number,
  rate: Money,
  quantity: number
) {
  /**
   * If Discount is applied after taxation
   * Formula: Rate * Quantity * (1 + Total Tax Rate / 100)
   */

  return rate.mul(quantity).mul(1 + totalTaxRate / 100);
}

function getRate(
  quantity: number,
  itemDiscountPercent: number,
  itemDiscountAmount: Money,
  totalTaxRate: number,
  itemTaxedTotal: Money,
  itemDiscountedTotal: Money,
  isItemTaxedTotal: boolean,
  discountAfterTax: boolean,
  setItemDiscountAmount: boolean
) {
  const isItemDiscountedTotal = !isItemTaxedTotal;
  const discountBeforeTax = !discountAfterTax;

  if (isItemDiscountedTotal && discountBeforeTax && setItemDiscountAmount) {
    return itemDiscountedTotal.add(itemDiscountAmount).div(quantity);
  }

  if (isItemDiscountedTotal && discountBeforeTax && !setItemDiscountAmount) {
    return itemDiscountedTotal.div(quantity * (1 - itemDiscountPercent / 100));
  }

  if (isItemDiscountedTotal && discountAfterTax && setItemDiscountAmount) {
    return itemDiscountedTotal
      .add(itemDiscountAmount)
      .div(quantity * (1 + totalTaxRate / 100));
  }

  if (isItemDiscountedTotal && discountAfterTax && !setItemDiscountAmount) {
    return itemDiscountedTotal.div(
      (quantity * (100 - itemDiscountPercent) * (100 + totalTaxRate)) / 100
    );
  }

  if (isItemTaxedTotal && discountAfterTax) {
    return itemTaxedTotal.div(quantity * (1 + totalTaxRate / 100));
  }

  if (isItemTaxedTotal && discountBeforeTax && setItemDiscountAmount) {
    return itemTaxedTotal
      .div(1 + totalTaxRate / 100)
      .add(itemDiscountAmount)
      .div(quantity);
  }

  if (isItemTaxedTotal && discountBeforeTax && !setItemDiscountAmount) {
    return itemTaxedTotal.div(
      quantity * (1 - itemDiscountPercent / 100) * (1 + totalTaxRate / 100)
    );
  }

  return null;
}
