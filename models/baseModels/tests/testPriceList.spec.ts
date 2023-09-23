import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { getItem } from 'models/inventory/tests/helpers';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const itemMap = {
  Pen: {
    name: 'Pen',
    rate: 100,
    unit: 'Unit',
  },
};

const partyMap = {
  partyOne: {
    name: 'John Whoe',
    email: 'john@whoe.com',
  },
};

const priceListMap = {
  PL_SELL: {
    name: 'PL_SELL',
    isSales: true,
    priceListItem: [
      {
        item: itemMap.Pen.name,
        rate: 101,
      },
    ],
  },
};

test('Price List: create dummy item, party, price lists', async (t) => {
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

  for (const priceListItem of Object.values(priceListMap)) {
    await fyo.doc.getNewDoc(ModelNameEnum.PriceList, priceListItem).sync();
    t.ok(
      await fyo.db.exists(ModelNameEnum.PriceList, priceListItem.name),
      `Price List: ${priceListItem.name} exists`
    );
  }

  await fyo.singles.AccountingSettings?.set('enablePriceList', true);
});

test('Check if InvoiceItem rate fetched from PriceList', async (t) => {
  const sinv = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    date: new Date('2023-01-01'),
    party: partyMap.partyOne.name,
  }) as SalesInvoice;

  await sinv.set('priceList', priceListMap.PL_SELL.name);
  await sinv.append('items', {});
  await sinv.items?.[0].set('item', itemMap.Pen.name);

  t.equal(
    sinv.items?.[0].rate?.float,
    priceListMap.PL_SELL.priceListItem[0].rate,
    `sales invoice rate fetched from price list`
  );
});

closeTestFyo(fyo, __filename);
