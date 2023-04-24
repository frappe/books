import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { getTestFyo, setupTestFyo } from 'tests/helpers';
import { getItem } from './helpers';
import { getDefaultMetaFieldValueMap } from 'backend/helpers';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

const itemMap = {
  Pen: {
    name: 'Pen',
    rate: 100,
    hasBatch: true,
  },
  Ink: {
    name: 'Ink',
    rate: 50,
  },
};

const partyMap = {
  partyOne: {
    name: 'John Whoe',
    email: 'john@whoe.com',
  }
};

const batchMap = {
  batchOne: {
    name: 'PN-AB001',
    manufactureDate: '2022-11-03T09:57:04.528',
  },
};

const priceListMap = {
  PN_SELL: {
    name: 'PN_SELL',
    enabled: true,
    buying: false,
    selling: true,
    isUomDependent: false,
  },
  PN_BUY: {
    name: 'PN_BUY',
    enabled: true,
    buying: true,
    selling: false,
    isUomDependent: false,
  },
  PN_SB: {
    name: 'PN_SB',
    enabled: true,
    selling: true,
    buying: true,
    isUomDependent: false,
  },
  PN_D: {
    name: 'PN_D',
    enabled: false,
    buying: true,
    selling: true,
    isUomDependent: false,
  },
};

const itemPriceMap = {
  itemPriceOne: {
    name: '000000001',
    enabled: true,
    item: itemMap.Pen.name,
    rate: 101,
    priceList: priceListMap.PN_SELL.name,
    buying: false,
    selling: true,
    party: partyMap.partyOne.name,
    validFrom: '2023-03-01T05:49:49.678Z',
    validUpto: '2023-03-31T05:49:49.678Z',
    ...getDefaultMetaFieldValueMap(),
  },
  itemPriceTwo: {
    name: '000000002',
    enabled: true,
    item: itemMap.Pen.name,
    rate: 102,
    priceList: priceListMap.PN_BUY.name,
    buying: true,
    selling: false,
    party: partyMap.partyOne.name,
    validFrom: '2023-03-01T05:49:49.678Z',
    validUpto: '2023-03-31T05:49:49.678Z',
    ...getDefaultMetaFieldValueMap(),
  },
  itemPriceThree: {
    name: '000000003',
    enabled: true,
    item: itemMap.Pen.name,
    rate: 103,
    priceList: priceListMap.PN_SB.name,
    buying: true,
    selling: true,
    party: partyMap.partyOne.name,
    validFrom: '2023-03-01T05:49:49.678Z',
    validUpto: '2023-03-31T05:49:49.678Z',
    ...getDefaultMetaFieldValueMap(),
  },
  itemPriceFour: {
    name: '000000004',
    enabled: true,
    item: itemMap.Pen.name,
    rate: 104,
    priceList: priceListMap.PN_SB.name,
    batch: batchMap.batchOne.name,
    buying: true,
    selling: true,
    party: partyMap.partyOne.name,
    validFrom: '2023-03-01T05:49:49.678Z',
    validUpto: '2023-03-31T05:49:49.678Z',
    ...getDefaultMetaFieldValueMap(),
  },
  itemPriceFive: {
    name: '000000005',
    enabled: true,
    item: itemMap.Pen.name,
    rate: 104,
    priceList: priceListMap.PN_D.name,
    buying: true,
    selling: true,
    party: partyMap.partyOne.name,
    validFrom: '2023-03-01T05:49:49.678Z',
    validUpto: '2023-03-31T05:49:49.678Z',
    ...getDefaultMetaFieldValueMap(),
  },
  itemPriceSix: {
    name: '000000006',
    enabled: false,
    item: itemMap.Pen.name,
    rate: 104,
    priceList: priceListMap.PN_SB.name,
    buying: true,
    selling: true,
    party: partyMap.partyOne.name,
    validFrom: '2023-02-01T05:49:49.678Z',
    validUpto: '2023-02-31T05:49:49.678Z',
    ...getDefaultMetaFieldValueMap(),
  },
};

test('Price List: create dummy items, parties and batches', async (t) => {
  // Create Items
  for (const { name, rate } of Object.values(itemMap)) {
    const item = getItem(name, rate, false);
    await fyo.doc.getNewDoc(ModelNameEnum.Item, item).sync();
    t.ok(await fyo.db.exists(ModelNameEnum.Item, name), `Item: ${name} exists`);
  }

  // Create Parties
  for (const { name, email } of Object.values(partyMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Party, { name, email }).sync();
    t.ok(
      await fyo.db.exists(ModelNameEnum.Party, name),
      `Party: ${name} exists`
    );
  }

  // Create Batches
  for (const batch of Object.values(batchMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.Batch, batch).sync();
    t.ok(
      await fyo.db.exists(ModelNameEnum.Batch, batch.name),
      `Batch: ${batch.name} exists`
    );
  }
});

test('create Price Lists', async (t) => {
  for (const priceListItem of Object.values(priceListMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.PriceList, priceListItem).sync();
    t.ok(
      await fyo.db.exists(ModelNameEnum.PriceList, priceListItem.name),
      `Price List ${priceListItem.name} exists`
    );
  }
});

test('create Item Prices', async (t) => {
  for (const itemPrice of Object.values(itemPriceMap)) {
    await fyo.db.insert(ModelNameEnum.ItemPrice, itemPrice);

    t.ok(
      fyo.db.exists(ModelNameEnum.ItemPrice, itemPrice.name),
      `item price ${itemPrice.name} exists`
    );
  }
});

test('check item price', async (t) => {
  // check selling enabled item price
  const sellEnabled = await fyo.db.getItemPrice(
    itemMap.Pen.name,
    priceListMap.PN_SELL.name,
    new Date(itemPriceMap.itemPriceOne.validFrom),
    true,
    partyMap.partyOne.name,
    'Unit',
    undefined
  );
  t.equal(sellEnabled, itemPriceMap.itemPriceOne.name);

  // check buying enabled item price
  const buyEnabled = await fyo.db.getItemPrice(
    itemMap.Pen.name,
    priceListMap.PN_BUY.name,
    new Date(itemPriceMap.itemPriceTwo.validFrom),
    false,
    partyMap.partyOne.name,
    'Unit',
    undefined
  );
  t.equal(buyEnabled, itemPriceMap.itemPriceTwo.name);

  // check buying & selling enabled item price
  const sbEnabled = await fyo.db.getItemPrice(
    itemMap.Pen.name,
    priceListMap.PN_SB.name,
    new Date(itemPriceMap.itemPriceThree.validFrom),
    true,
    partyMap.partyOne.name,
    'Unit',
    undefined
  );
  t.equal(sbEnabled, itemPriceMap.itemPriceThree.name);

  // check sell batch enabled
  const sellBatchEnabled = await fyo.db.getItemPrice(
    itemMap.Pen.name,
    priceListMap.PN_SB.name,
    new Date(itemPriceMap.itemPriceFour.validFrom),
    true,
    partyMap.partyOne.name,
    'Unit',
    batchMap.batchOne.name
  );
  t.equal(sellBatchEnabled, itemPriceMap.itemPriceFour.name);

  // false returns

  const sbEnabledInk = await fyo.db.getItemPrice(
    itemMap.Ink.name,
    priceListMap.PN_SB.name,
    new Date(itemPriceMap.itemPriceFour.validFrom),
    true,
    partyMap.partyOne.name,
    'Unit',
    batchMap.batchOne.name
  );

  t.equal(
    sbEnabledInk,
    false,
    'itemPrice of non-existing item in price list returns false'
  );

  const sbDisabled = await fyo.db.getItemPrice(
    itemMap.Pen.name,
    priceListMap.PN_D.name,
    new Date(itemPriceMap.itemPriceFive.validFrom),
    true,
    partyMap.partyOne.name,
    'Unit',
    undefined
  );
  t.equal(
    sbDisabled,
    false,
    'price list disabled, itemPrice enabled returns false'
  );

  const sbItemPriceDisabled = await fyo.db.getItemPrice(
    itemMap.Pen.name,
    priceListMap.PN_SB.name,
    new Date(itemPriceMap.itemPriceSix.validFrom),
    true,
    partyMap.partyOne.name,
    'Unit',
    undefined
  );
  t.equal(
    sbItemPriceDisabled,
    false,
    'price list enabled, itemPrice disabled returns false'
  );
});

test.onFinish(async () => {
  await fyo.close();
});
