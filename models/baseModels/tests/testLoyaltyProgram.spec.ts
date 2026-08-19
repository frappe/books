import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ModelNameEnum } from 'models/types';
import { Party } from '../Party/Party';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { getLoyaltyProgramTier } from 'models/helpers';
import { CollectionRulesItems } from '../CollectionRulesItems/CollectionRulesItems';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

const accountData = {
  name: 'Loyalty Point Redemption',
  rootType: 'Liability',
  parentAccount: 'Accounts Payable',
  isGroup: false,
};

const itemData = {
  name: 'Pen',
  rate: 4000,
  for: 'Both',
};

const partyData = {
  name: 'John Whoe',
  email: 'john@whoe.com',
};

const loyaltyProgramData = {
  name: 'program',
  fromDate: new Date('12/10/2024'),
  toDate: new Date('12/30/2024'),
  email: 'sample@gmail.com',
  mobile: '1234567890',
  expenseAccount: accountData.name,
};

const collectionRulesData = [
  {
    tierName: 'Silver',
    collectionFactor: 0.5,
    minimumTotalSpent: 2000,
  },
  { tierName: 'Gold', collectionFactor: 0.5, minimumTotalSpent: 3000 },
];

test('create test docs', async (t) => {
  await fyo.doc.getNewDoc(ModelNameEnum.Item, itemData).sync();

  t.ok(
    fyo.db.exists(ModelNameEnum.Item, itemData.name),
    `dummy item ${itemData.name}  exists`
  );

  await fyo.doc.getNewDoc(ModelNameEnum.Party, partyData).sync();

  t.ok(
    fyo.db.exists(ModelNameEnum.Party, partyData.name),
    `dummy party ${partyData.name} exists`
  );

  await fyo.doc.getNewDoc(ModelNameEnum.Account, accountData).sync();

  t.ok(
    fyo.db.exists(ModelNameEnum.Account, accountData.name),
    `dummy account ${accountData.name}  exists`
  );
});

test('create a Loyalty Program document', async (t) => {
  const loyaltyProgramDoc = fyo.doc.getNewDoc(
    ModelNameEnum.LoyaltyProgram,
    loyaltyProgramData
  );

  await loyaltyProgramDoc.append('collectionRules', collectionRulesData[0]);

  await loyaltyProgramDoc.append('collectionRules', collectionRulesData[1]);

  await loyaltyProgramDoc.sync();

  t.ok(
    fyo.db.exists(ModelNameEnum.LoyaltyProgram, loyaltyProgramData.name),
    `Loyalty Program '${loyaltyProgramData.name}' exists `
  );

  const partyDoc = (await fyo.doc.getDoc(
    ModelNameEnum.Party,
    partyData.name
  )) as Party;

  await partyDoc.setAndSync('loyaltyProgram', loyaltyProgramData.name);

  t.equals(
    partyDoc.loyaltyProgram,
    loyaltyProgramData.name,
    `Loyalty Program '${loyaltyProgramData.name}' successfully added to Party '${partyData.name}'`
  );
});

async function loyaltyPointEntryDoc(sinvName: string) {
  const loyaltyPointEntryData = (await fyo.db.getAll(
    ModelNameEnum.LoyaltyPointEntry,
    {
      fields: ['name', 'customer', 'loyaltyPoints', 'loyaltyProgramTier'],
      filters: { invoice: sinvName! },
    }
  )) as {
    name?: string;
    customer?: string;
    loyaltyPoints?: number;
    loyaltyProgramTier?: string;
  }[];

  if (loyaltyPointEntryData) {
    return loyaltyPointEntryData[0];
  }
}

async function createSalesInvoice() {
  const sinvDoc = fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
    account: 'Debtors',
    party: partyData.name,
    date: new Date('12/11/2024'),
    items: [
      {
        item: itemData.name,
        rate: itemData.rate,
        quantity: 1,
      },
    ],
  }) as SalesInvoice;

  return sinvDoc;
}

test('create Sales Invoice and verify loyalty points are created correctly', async (t) => {
  const sinvDoc = await createSalesInvoice();

  await sinvDoc.sync();
  await sinvDoc.submit();

  t.ok(
    fyo.db.exists(ModelNameEnum.SalesInvoice, sinvDoc.name),
    `Sales Invoice '${sinvDoc.name}' exists`
  );

  t.ok(
    fyo.db.exists(ModelNameEnum.SalesInvoice, sinvDoc.loyaltyProgram),
    `Loyalty Program '${sinvDoc.loyaltyProgram}' should be linked to Sales Invoice '${sinvDoc.name}'`
  );

  t.equals(
    sinvDoc.loyaltyProgram,
    loyaltyProgramData.name,
    `Loyalty Program '${sinvDoc.loyaltyProgram}' linked to Sales Invoice'`
  );

  const loyaltyPointEntryData = await loyaltyPointEntryDoc(
    sinvDoc.name as string
  );

  const loyaltyProgramDoc = (await fyo.doc.getDoc(
    ModelNameEnum.LoyaltyProgram,
    sinvDoc.loyaltyProgram
  )) as Party;

  const selectedTier: CollectionRulesItems | undefined = getLoyaltyProgramTier(
    loyaltyProgramDoc,
    fyo.pesa(itemData.rate)
  );

  t.equals(
    loyaltyPointEntryData?.loyaltyProgramTier,
    selectedTier?.tierName,
    `tier name ${loyaltyPointEntryData?.loyaltyProgramTier} matches.'`
  );

  const tierData = collectionRulesData.find((rule) => {
    return rule.tierName === loyaltyPointEntryData?.loyaltyProgramTier;
  });

  t.equals(
    loyaltyPointEntryData?.loyaltyPoints,
    itemData.rate * (tierData?.collectionFactor as number),
    `calculation of ${loyaltyPointEntryData?.loyaltyPoints} loyalty Point is correct'`
  );
});

test('create SINV with future date and verify loyalty points are not created', async (t) => {
  const futureDate = new Date(new Date().setDate(new Date().getDate() + 20));

  const sinvDoc = await createSalesInvoice();
  sinvDoc.date = futureDate;

  await sinvDoc.sync();
  await sinvDoc.submit();

  t.ok(
    fyo.db.exists(ModelNameEnum.SalesInvoice, sinvDoc.name),
    `Sales Invoice '${sinvDoc.name}' exists`
  );

  const loyaltyPointEntryData = await loyaltyPointEntryDoc(
    sinvDoc.name as string
  );
  t.equals(
    loyaltyPointEntryData,
    undefined,
    'Loyalty points should not be created for a future-dated Sales Invoice'
  );
});

test('redeem loyalty points and verify a new loyalty point entry doc is created', async (t) => {
  const sinvDoc = await createSalesInvoice();

  sinvDoc.redeemLoyaltyPoints = true;
  sinvDoc.loyaltyPoints = 1000;

  await sinvDoc.sync();
  await sinvDoc.submit();

  t.ok(
    fyo.db.exists(ModelNameEnum.SalesInvoice, sinvDoc.name),
    `Sales Invoice '${sinvDoc.name}' exists`
  );

  const loyaltyPointEntryData = await loyaltyPointEntryDoc(
    sinvDoc.name as string
  );

  t.ok(
    await fyo.db.exists(
      ModelNameEnum.LoyaltyPointEntry,
      loyaltyPointEntryData?.name
    ),
    `Negative Loyalty Point Entry '${loyaltyPointEntryData?.name}' should be created against Sales Invoice '${sinvDoc.name}'`
  );

  t.equals(
    loyaltyPointEntryData?.loyaltyPoints,
    -1000,
    `redeemed loyalty point matches the loyalty points used`
  );

  const partyDoc = (await fyo.doc.getDoc(
    ModelNameEnum.Party,
    partyData.name
  )) as Party;

  const totalPoints = await partyDoc._getTotalLoyaltyPoints();

  t.equals(
    totalPoints,
    itemData.rate * collectionRulesData[1].collectionFactor + -1000,
    `Customer '${partyData.name}' should have a total of ${totalPoints} loyalty points after redemption`
  );
});

closeTestFyo(fyo, __filename);
