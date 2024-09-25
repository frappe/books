import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { getItem } from 'models/inventory/tests/helpers';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { PricingRule } from '../PricingRule/PricingRule';
import { assertThrows } from 'backend/database/tests/helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const itemMap = {
  Jacket: {
    name: 'Jacket',
    rate: 1000,
    unit: 'Unit',
  },
  Cap: {
    name: 'Cap',
    rate: 100,
    unit: 'Unit',
  },
};

const partyMap = {
  partyOne: {
    name: 'Daisy',
    email: 'daisy@alien.com',
    account: 'Debtors',
  },
};

const pricingRuleMap = [
  {
    name: 'PRLE-1001',
    title: 'JKT PDR Offer',
    isCouponCodeBased: true,
    appliedItems: [{ item: itemMap.Jacket.name }],
    discountType: 'Price Discount',
    priceDiscountType: 'rate',
    discountRate: 800,
    minQuantity: 4,
    maxQuantity: 6,
    minAmount: fyo.pesa(4000),
    maxAmount: fyo.pesa(6000),
    validFrom: '2024-02-01',
    validTo: '2024-02-29',
    priority: '1',
  },
  {
    name: 'PRLE-1002',
    title: 'CAP PDR Offer',
    appliedItems: [{ item: itemMap.Cap.name }],
    discountType: 'Product Discount',
    freeItem: 'Cap',
    freeItemQuantity: 1,
    freeItemUnit: 'Unit',
    freeItemRate: 0,
    minQuantity: 4,
    maxQuantity: 6,
    minAmount: 200,
    maxAmount: 1000,
    validFrom: '2024-02-01',
    validTo: '2024-02-29',
    priority: '1',
  },
];
const couponCodesMap = [
  {
    name: 'COUPON1',
    isEnabled: true,
    couponName: 'coupon1',
    pricingRule: pricingRuleMap[0].name,
    maximumUse: 5,
    used: 0,
    minAmount: fyo.pesa(4000),
    maxAmount: fyo.pesa(6000),
    validFrom: '2024-02-01',
    validTo: '2024-02-29',
  },
  {
    name: 'COUPON2',
    couponName: 'coupon2',
    pricingRule: pricingRuleMap[1].name,
    maximumUse: 1,
    used: 0,
    minAmount: 200,
    maxAmount: 1000,
    validFrom: '2024-02-01',
    validTo: '2024-02-29',
  },
];

test(' Coupon Codes: create dummy item, party, pricing rules, coupon codes', async (t) => {
  // Create Items
  for (const { name, rate } of Object.values(itemMap)) {
    const item = getItem(name, rate, false);

    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();

    t.ok(await fyo.db.exists(ModelNameEnum.Item, name), `Item: ${name} exists`);
  }

  // Create Party
  await fyo.doc.getNewDoc(ModelNameEnum.Party, partyMap.partyOne).sync();

  t.ok(
    await fyo.db.exists(ModelNameEnum.Party, partyMap.partyOne.name),
    `Party: ${partyMap.partyOne.name} exists`
  );

  // Create Pricing Rules
  for (const pricingRule of Object.values(pricingRuleMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.PricingRule, pricingRule).sync();

    t.ok(
      await fyo.db.exists(ModelNameEnum.PricingRule, pricingRule.name),
      `Pricing Rule: ${pricingRule.name} exists`
    );
  }

  await fyo.singles.AccountingSettings?.set('enablePricingRule', true);

  t.ok(fyo.singles.AccountingSettings?.enablePricingRule);

  // Create Coupon Codes
  for (const couponCodes of Object.values(couponCodesMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.CouponCode, couponCodes).sync();

    t.ok(
      await fyo.db.exists(ModelNameEnum.CouponCode, couponCodes.name),
      `Coupoon Code: ${couponCodes.name} exists`
    );
  }

  await fyo.singles.AccountingSettings?.set('enableCouponCode', true);

  t.ok(fyo.singles.AccountingSettings?.enableCouponCode);
});

test('disabled coupon codes is not applied', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-01-20T18:30:00.000Z',
    party: partyMap.partyOne.name,
    account: partyMap.partyOne.account,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });

  await sinv.append('coupons', {
    coupons: couponCodesMap[0].name,
  });

  await sinv.runFormulas();

  t.equal(sinv.pricingRuleDetail?.length, undefined);
});

test('Coupon code not created: coupons min amount must be lesser than coupons max.', async (t) => {
  couponCodesMap[0].minAmount = fyo.pesa(7000);

  const ccodeDoc = fyo.doc.getNewDoc(
    ModelNameEnum.CouponCode,
    couponCodesMap[0]
  ) as PricingRule;

  await assertThrows(
    async () => await ccodeDoc.sync(),
    'Minimum Amount should be less than the Maximum Amount'
  );
});

test('Coupon code not created: pricing rules max amount is lower than the coupons min.', async (t) => {
  couponCodesMap[0].minAmount = fyo.pesa(3000);

  const ccodeDoc = fyo.doc.getNewDoc(
    ModelNameEnum.CouponCode,
    couponCodesMap[0]
  ) as PricingRule;

  await assertThrows(
    async () => await ccodeDoc.sync(),
    "Minimum Amount should be greather than the Pricing Rule's Minimum Amount"
  );
});

test('coupon code not created: pricing rules max amount is lower than the coupons max.', async (t) => {
  couponCodesMap[0].maxAmount = fyo.pesa(7000);

  const ccodeDoc = fyo.doc.getNewDoc(
    ModelNameEnum.CouponCode,
    couponCodesMap[0]
  ) as PricingRule;

  await assertThrows(
    async () => await ccodeDoc.sync(),
    "Maximum Amount should be lesser than Pricing Rule's Maximum Amount"
  );
});

test("coupon code is not applied when coupon's validfrom date < coupon's validTo date", async (t) => {
  couponCodesMap[0].minAmount = fyo.pesa(4000);
  couponCodesMap[0].maxAmount = fyo.pesa(6000);
  couponCodesMap[0].validTo = '2024-01-10';

  const ccodeDoc = fyo.doc.getNewDoc(
    ModelNameEnum.CouponCode,
    couponCodesMap[0]
  ) as PricingRule;

  await assertThrows(
    async () => await ccodeDoc.sync(),
    'Valid From Date should be less than Valid To Date'
  );
});

test("coupon code is not applied when coupon's validFrom date < pricing rule's validFrom date", async (t) => {
  couponCodesMap[0].validFrom = '2024-01-01';

  const ccodeDoc = fyo.doc.getNewDoc(
    ModelNameEnum.CouponCode,
    couponCodesMap[0]
  ) as PricingRule;

  await assertThrows(
    async () => await ccodeDoc.sync(),
    "Valid From Date should be greather than Pricing Rule's Valid From Date"
  );
});

test("coupon code is not applied when coupon's validTo date > pricing rule's validTo date", async (t) => {
  couponCodesMap[0].validFrom = '2024-02-01';
  couponCodesMap[0].validTo = '2024-03-01';

  const ccodeDoc = fyo.doc.getNewDoc(
    ModelNameEnum.CouponCode,
    couponCodesMap[0]
  ) as PricingRule;

  await assertThrows(
    async () => await ccodeDoc.sync(),
    "Valid To Date should be lesser than Pricing Rule's Valid To Date"
  );
});

test('apply coupon code', async (t) => {
  couponCodesMap[0].name = 'COUPON1';
  couponCodesMap[0].validTo = '2024-02-29';

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-10',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });

  await sinv.append('coupons', { coupons: couponCodesMap[0].name });
  await sinv.runFormulas();

  t.equal(sinv.pricingRuleDetail?.length, 1);

  t.equal(
    sinv.pricingRuleDetail![0].referenceName,
    pricingRuleMap[0].name,
    'Pricing Rule is applied'
  );
});

test('Coupon not applied: incorrect items added.', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-10',
    party: partyMap.partyOne.name,
    account: partyMap.partyOne.account,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });

  await sinv.append('coupons', { coupons: couponCodesMap[0].name });

  await sinv.runFormulas();
  await sinv.sync();

  t.equal(sinv.coupons?.length, 0, 'coupon code is not applied');
});

closeTestFyo(fyo, __filename);
