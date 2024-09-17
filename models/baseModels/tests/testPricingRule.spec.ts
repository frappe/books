import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { getItem } from 'models/inventory/tests/helpers';
import { PricingRule } from '../PricingRule/PricingRule';

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
  },
};

const pricingRuleMap = [
  {
    name: 'PRLE-1001',
    isEnabled: false,
    title: 'JKT PDR Offer',
    appliedItems: [{ item: itemMap.Jacket.name }],
    discountType: 'Price Discount',
    priceDiscountType: 'rate',
    discountRate: 800,
    minQuantity: 4,
    maxQuantity: 6,
    minAmount: fyo.pesa(4000),
    maxAmount: fyo.pesa(6000),
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

test('Pricing Rule: create dummy item, party, pricing rules', async (t) => {
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
      `Price List: ${pricingRule.name} exists`
    );
  }

  await fyo.singles.AccountingSettings?.set('enablePricingRule', true);
  t.ok(fyo.singles.AccountingSettings?.enablePricingRule);
});

test('disabled pricing rule is not applied', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', { item: itemMap.Jacket.name, quantity: 5 });
  await sinv.runFormulas();

  t.equal(sinv.pricingRuleDetail?.length, 0);
});

test('pricing rule is applied when filtered by min and max qty', async (t) => {
  const pruleDoc = (await fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    pricingRuleMap[0].name
  )) as PricingRule;

  await pruleDoc.set('isEnabled', true);
  await pruleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail![0].referenceName,
    pricingRuleMap[0].name,
    'Pricing Rule is added to Pricing Rule Detail'
  );

  t.equal(
    sinv.items![0].rate!.float,
    pricingRuleMap[0].discountRate,
    'item rate fetched from Pricing Rule'
  );
});

test('pricing rule is not applied when item qty is < min  qty', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', { item: itemMap.Jacket.name, quantity: 3 });
  await sinv.runFormulas();

  t.equal(sinv.pricingRuleDetail?.length, undefined);
});

test('pricing rule is not applied when item qty is > max  qty', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', { item: itemMap.Jacket.name, quantity: 10 });
  await sinv.runFormulas();

  t.equal(sinv.pricingRuleDetail?.length, undefined);
});

test('pricing rule is applied when filtered by min and max amount', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail![0].referenceName,
    pricingRuleMap[0].name,
    'Pricing Rule is added to Pricing Rule Detail'
  );

  t.equal(
    sinv.items![0].rate!.float,
    pricingRuleMap[0].discountRate,
    'item rate fetched from Pricing Rule'
  );
});

test('Pricing Rule is not applied when item amount is < min  amount', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 2,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('Pricing Rule is not applied when item amount is > max amount', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date(),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 7,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('Pricing Rule is not applied when sinvDate < validFrom date', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-01-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('Pricing Rule is not applied when sinvDate > validFrom date', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-03-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('Pricing Rule is applied when filtered by qty, amount and dates', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail![0].referenceName,
    pricingRuleMap[1].name,
    'Pricing Rule is applied'
  );
});

test('Pricing Rule is applied when filtered by qty, amount and dates', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail![0].referenceName,
    pricingRuleMap[1].name,
    'Pricing Rule is applied'
  );
});

test('Pricing Rule is not applied when qty condition is false, rest is true', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 7,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('Pricing Rule is not applied when amount condition is false, rest is true', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: fyo.pesa(250),
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('Pricing Rule is not applied when validity condition is false, rest is true', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-03-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail?.length,
    undefined,
    'Pricing Rule is not applied'
  );
});

test('create two pricing rules, Highest priority pricing rule is applied', async (t) => {
  const newPricingRuleDoc = fyo.doc.getNewDoc(ModelNameEnum.PricingRule, {
    ...pricingRuleMap[1],
    priority: '2',
    appliedItems: [{ item: itemMap.Cap.name }],
  });

  await newPricingRuleDoc.runFormulas();
  await newPricingRuleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(
    sinv.pricingRuleDetail![0].referenceName,
    'PRLE-1003',
    'Pricing Rule with highest priority is applied'
  );
});

test('Pricing Rule is not applied due to two docs having same priority', async (t) => {
  const pricingRuleDoc = await fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    'PRLE-1003'
  );

  await pricingRuleDoc.set('priority', '1');
  await pricingRuleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();

  t.equal(!!sinv.pricingRuleDetail?.length, false);
});

test('create a price discount of type rate, discounted rate should apply', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(sinv.items![0].rate?.float, pricingRuleMap[0].discountRate);
});

test('create a price discount of type percent, discount percent should apply', async (t) => {
  const pricingRuleDoc = await fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    pricingRuleMap[0].name
  );

  await pricingRuleDoc.setMultiple({
    priceDiscountType: 'percentage',
    discountPercentage: 69,
  });

  await pricingRuleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(sinv.items![0].itemDiscountPercent, 69);
});

test('create a price discount of type amount, discount amount should apply', async (t) => {
  const pricingRuleDoc = await fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    pricingRuleMap[0].name
  );

  await pricingRuleDoc.setMultiple({
    priceDiscountType: 'amount',
    discountAmount: 500,
  });

  await pricingRuleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Jacket.name,
    quantity: 5,
    rate: itemMap.Jacket.rate,
  });
  await sinv.runFormulas();

  t.equal(sinv.items![0].itemDiscountAmount!.float, 2500);
});

test('create a product discount giving 1 free item', async (t) => {
  const pricingRuleDoc = await fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    'PRLE-1003'
  );

  await pricingRuleDoc.set('isEnabled', false);
  await pricingRuleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();
  await sinv.sync();

  t.equal(!!sinv.items![1].isFreeItem, true);
  t.equal(sinv.items![1].rate!.float, pricingRuleMap[1].freeItemRate);
  t.equal(sinv.items![1].quantity, pricingRuleMap[1].freeItemQuantity);
});

test('create a product discount, recurse 2', async (t) => {
  const pricingRuleDoc = await fyo.doc.getDoc(
    ModelNameEnum.PricingRule,
    'PRLE-1003'
  );

  await pricingRuleDoc.set('isRecursive', true);
  await pricingRuleDoc.set('recurseEvery', 2);
  await pricingRuleDoc.sync();

  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    date: '2024-02-01',
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.append('items', {
    item: itemMap.Cap.name,
    quantity: 5,
    rate: itemMap.Cap.rate,
  });
  await sinv.runFormulas();
  await sinv.sync();

  t.equal(!!sinv.items![1].isFreeItem, true);
  t.equal(sinv.items![1].rate!.float, pricingRuleMap[1].freeItemRate);
  t.equal(sinv.items![1].quantity, pricingRuleMap[1].freeItemQuantity);
});

closeTestFyo(fyo, __filename);
