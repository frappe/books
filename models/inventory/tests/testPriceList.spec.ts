import {
  assertDoesNotThrow,
  assertThrows,
} from 'backend/database/tests/helpers';
import { FieldValueMap } from 'backend/database/types';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { getItem } from './helpers';
import { getDefaultMetaFieldValueMap } from 'backend/helpers';

const fyo = getTestFyo();

setupTestFyo(fyo, __filename);

const itemMap = {
  Pen: {
    name: 'Pen',
    rate: 100,
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
  partyTwo: {
    name: 'Don Whoe',
    email: 'don@whoe.com',
  },
};

const batchMap = {
  batchOne: {
    name: 'PN-AB001',
    manufactureDate: '2022-11-03T09:57:04.528',
  },
  batchTwo: {
    name: 'PN-AB002',
    manufactureDate: '2022-10-03T09:57:04.528',
  },
  batchThree: {
    name: 'PN-AB003',
    manufactureDate: '2022-10-03T09:57:04.528',
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
  PN_SB_UOM_DEP: {
    name: 'PN_SB_UOM_DEP',
    enabled: true,
    buying: true,
    selling: true,
    isUomDependent: true,
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
    enabled: true,
    item: itemMap.Pen.name,
    buying: true,
    selling: true,
    party: partyMap.partyOne.name,
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
      `Price List: ${priceListItem.name} exists`
    );
  }
});

test('create ItemPrices', async (t) => {
  for (const itemPrice of Object.values(itemPriceMap)) {
    t.ok(await fyo.doc.getNewDoc(ModelNameEnum.PriceList, itemPrice).sync());
  }
});

test('price list enabled : create Sales Invoice', async (t) => {
  const invoiceItems: FieldValueMap[] = [
    {
      item: itemMap.Pen.name,
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ];
  const invoice = {
    date: '2022-01-21',
    party: partyMap.partyOne.name,
    account: 'Debtors',
    priceList: priceListMap.PN_SELL.name,
    items: invoiceItems,
  };

  await (
    await fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, invoice).sync()
  ).submit();
});

test.onFinish(async () => {
  await fyo.close();
});
