import test from 'tape';
import { getDefaultMetaFieldValueMap } from 'backend/helpers';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { getItem } from 'models/inventory/tests/helpers';
import { getItemPrice } from 'models/helpers';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { PurchaseInvoiceItem } from '../PurchaseInvoiceItem/PurchaseInvoiceItem';

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
  },
};

const batchMap = {
  batchOne: {
    name: 'PL-AB001',
    manufactureDate: '2022-11-03T09:57:04.528',
  },
};

const priceListMap = {
  PL_SELL: {
    name: 'PL_SELL',
    enabled: true,
    party: 'Shaju',
    buying: false,
    selling: true,
    isUomDependent: false,
    itemPrice: [
      {
        enabled: true,
        item: itemMap.Pen.name,
        rate: 101,
        buying: false,
        selling: true,
        party: partyMap.partyOne.name,
        validFrom: '2023-02-28T18:30:00.678Z',
        validUpto: '2023-03-30T18:30:00.678Z',
        ...getDefaultMetaFieldValueMap(),
      },
    ],
  },
  PL_BUY: {
    name: 'PL_BUY',
    enabled: true,
    buying: true,
    selling: false,
    isUomDependent: false,
    itemPrice: [
      {
        enabled: true,
        item: itemMap.Pen.name,
        rate: 102,
        buying: true,
        selling: false,
        party: partyMap.partyOne.name,
        validFrom: '2023-02-28T18:30:00.678Z',
        validUpto: '2023-03-30T18:30:00.678Z',
        ...getDefaultMetaFieldValueMap(),
      },
    ],
  },
  PL_SB: {
    name: 'PL_SB',
    enabled: true,
    selling: true,
    buying: true,
    isUomDependent: false,
    itemPrice: [
      {
        enabled: true,
        item: itemMap.Pen.name,
        rate: 104,
        batch: batchMap.batchOne.name,
        buying: true,
        selling: true,
        party: partyMap.partyOne.name,
        validFrom: '2023-05-05T18:30:00.000Z',
        validUpto: '2023-06-05T18:30:00.000Z',
        ...getDefaultMetaFieldValueMap(),
      },
    ],
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

test('check item price', async (t) => {
  // check selling enabled item price
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    items: [{ item: itemMap.Pen.name, quantity: 1 }],
    date: priceListMap.PL_SELL.itemPrice[0].validFrom,
    priceList: priceListMap.PL_SELL.name,
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  const sinvItem = Object.values(sinv.items ?? {})[0];
  const sellEnabled = await getItemPrice(sinvItem as SalesInvoiceItem);

  const sellEnabledPLName = await fyo.getValue(
    ModelNameEnum.ItemPrice,
    sellEnabled as string,
    'parent'
  );

  t.equal(sellEnabledPLName, priceListMap.PL_SELL.name);

  // check buying enabled item price
  const pinv = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
    items: [{ item: itemMap.Pen.name, quantity: 1 }],
    date: priceListMap.PL_BUY.itemPrice[0].validFrom,
    priceList: priceListMap.PL_BUY.name,
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  const pinvItem = Object.values(pinv.items ?? {})[0];
  const buyEnabled = await getItemPrice(pinvItem as PurchaseInvoiceItem);

  const buyEnabledPLName = await fyo.getValue(
    ModelNameEnum.ItemPrice,
    buyEnabled as string,
    'parent'
  );

  t.equal(buyEnabledPLName, priceListMap.PL_BUY.name);

  // check sell batch enabled
  const sinv1 = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    items: [
      { item: itemMap.Pen.name, quantity: 1, batch: batchMap.batchOne.name },
    ],
    date: priceListMap.PL_SB.itemPrice[0].validFrom,
    priceList: priceListMap.PL_SB.name,
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  const sinv1Item = Object.values(sinv1.items ?? {})[0];
  const sellBatchEnabled = await getItemPrice(sinv1Item as SalesInvoiceItem);

  const sellBatchEnabledPLName = await fyo.getValue(
    ModelNameEnum.ItemPrice,
    sellBatchEnabled as string,
    'parent'
  );

  t.equal(sellBatchEnabledPLName, priceListMap.PL_SB.name);

  // undefined returns
  const sinv2 = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    items: [{ item: itemMap.Ink.name, quantity: 1 }],
    date: priceListMap.PL_SELL.itemPrice[0].validFrom,
    priceList: priceListMap.PL_SELL.name,
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  const sinv2Item = Object.values(sinv2.items ?? {})[0];
  const nonExistItem = await getItemPrice(sinv2Item as SalesInvoiceItem);

  t.equal(
    nonExistItem,
    undefined,
    'itemPrice of non-existing item in price list returns false'
  );
});

closeTestFyo(fyo, __filename);
