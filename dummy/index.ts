import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { range, sample } from 'lodash';
import { DateTime } from 'luxon';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { Payment } from 'models/baseModels/Payment/Payment';
import { PurchaseInvoice } from 'models/baseModels/PurchaseInvoice/PurchaseInvoice';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { ModelNameEnum } from 'models/types';
import setupInstance from 'src/setup/setupInstance';
import { getMapFromList, safeParseInt } from 'utils';
import { getFiscalYear } from 'utils/misc';
import {
  flow,
  getFlowConstant,
  getRandomDates,
  purchaseItemPartyMap,
} from './helpers';
import items from './items.json';
import logo from './logo';
import parties from './parties.json';

type Notifier = (stage: string, percent: number) => void;

export async function setupDummyInstance(
  dbPath: string,
  fyo: Fyo,
  years = 1,
  baseCount = 1000,
  notifier?: Notifier
) {
  await fyo.purgeCache();
  notifier?.(fyo.t`Setting Up Instance`, -1);
  const options = {
    logo: null,
    companyName: "Flo's Clothes",
    country: 'India',
    fullname: 'Lin Florentine',
    email: 'lin@flosclothes.com',
    bankName: 'Supreme Bank',
    currency: 'INR',
    fiscalYearStart: getFiscalYear('04-01', true)!.toISOString(),
    fiscalYearEnd: getFiscalYear('04-01', false)!.toISOString(),
    chartOfAccounts: 'India - Chart of Accounts',
  };
  await setupInstance(dbPath, options, fyo);
  fyo.store.skipTelemetryLogging = true;

  years = Math.floor(years);
  notifier?.(fyo.t`Creating Items and Parties`, -1);
  await generateStaticEntries(fyo);
  await generateDynamicEntries(fyo, years, baseCount, notifier);
  await setOtherSettings(fyo);

  const instanceId = (await fyo.getValue(
    ModelNameEnum.SystemSettings,
    'instanceId'
  )) as string;

  fyo.store.skipTelemetryLogging = false;
  return { companyName: options.companyName, instanceId };
}

async function setOtherSettings(fyo: Fyo) {
  const doc = await fyo.doc.getDoc(ModelNameEnum.PrintSettings);
  const address = fyo.doc.getNewDoc(ModelNameEnum.Address);
  await address.setAndSync({
    addressLine1: '1st Column, Fitzgerald Bridge',
    city: 'Pune',
    state: 'Maharashtra',
    pos: 'Maharashtra',
    postalCode: '411001',
    country: 'India',
  });

  await doc.setAndSync({
    color: '#F687B3',
    template: 'Business',
    displayLogo: true,
    phone: '+91 8983-000418',
    logo,
    address: address.name,
  });

  const acc = await fyo.doc.getDoc(ModelNameEnum.AccountingSettings);
  await acc.setAndSync({
    gstin: '27LIN180000A1Z5',
  });
}

/**
 *  warning: long functions ahead!
 */

async function generateDynamicEntries(
  fyo: Fyo,
  years: number,
  baseCount: number,
  notifier?: Notifier
) {
  const salesInvoices = await getSalesInvoices(fyo, years, baseCount, notifier);

  notifier?.(fyo.t`Creating Purchase Invoices`, -1);
  const purchaseInvoices = await getPurchaseInvoices(fyo, years, salesInvoices);

  notifier?.(fyo.t`Creating Journal Entries`, -1);
  const journalEntries = await getJournalEntries(fyo, salesInvoices);
  await syncAndSubmit(journalEntries, notifier);

  const invoices = ([salesInvoices, purchaseInvoices].flat() as Invoice[]).sort(
    (a, b) => +(a.date as Date) - +(b.date as Date)
  );
  await syncAndSubmit(invoices, notifier);

  const payments = await getPayments(fyo, invoices);
  await syncAndSubmit(payments, notifier);
}

async function getJournalEntries(fyo: Fyo, salesInvoices: SalesInvoice[]) {
  const entries = [];
  const amount = salesInvoices
    .map((i) => i.items!)
    .flat()
    .reduce((a, b) => a.add(b.amount!), fyo.pesa(0))
    .percent(75)
    .clip(0);
  const lastInv = salesInvoices.sort((a, b) => +a.date! - +b.date!).at(-1)!
    .date!;
  const date = DateTime.fromJSDate(lastInv).minus({ months: 6 }).toJSDate();

  // Bank Entry
  let doc = fyo.doc.getNewDoc(
    ModelNameEnum.JournalEntry,
    {
      date,
      entryType: 'Bank Entry',
    },
    false
  );
  await doc.append('accounts', {
    account: 'Supreme Bank',
    debit: amount,
    credit: fyo.pesa(0),
  });

  await doc.append('accounts', {
    account: 'Secured Loans',
    credit: amount,
    debit: fyo.pesa(0),
  });
  entries.push(doc);

  // Cash Entry
  doc = fyo.doc.getNewDoc(
    ModelNameEnum.JournalEntry,
    {
      date,
      entryType: 'Cash Entry',
    },
    false
  );
  await doc.append('accounts', {
    account: 'Cash',
    debit: amount.percent(30),
    credit: fyo.pesa(0),
  });

  await doc.append('accounts', {
    account: 'Supreme Bank',
    credit: amount.percent(30),
    debit: fyo.pesa(0),
  });
  entries.push(doc);

  return entries;
}

async function getPayments(fyo: Fyo, invoices: Invoice[]) {
  const payments = [];
  for (const invoice of invoices) {
    // Defaulters
    if (invoice.isSales && Math.random() < 0.007) {
      continue;
    }

    const doc = fyo.doc.getNewDoc(ModelNameEnum.Payment, {}, false) as Payment;
    doc.party = invoice.party as string;
    doc.paymentType = invoice.isSales ? 'Receive' : 'Pay';
    doc.paymentMethod = 'Cash';
    doc.date = DateTime.fromJSDate(invoice.date as Date)
      .plus({ hours: 1 })
      .toJSDate();
    if (doc.paymentType === 'Receive') {
      doc.account = 'Debtors';
      doc.paymentAccount = 'Cash';
    } else {
      doc.account = 'Cash';
      doc.paymentAccount = 'Creditors';
    }
    doc.amount = invoice.outstandingAmount;

    // Discount
    if (invoice.isSales && Math.random() < 0.05) {
      await doc.set('writeOff', invoice.outstandingAmount?.percent(15));
    }

    doc.push('for', {
      referenceType: invoice.schemaName,
      referenceName: invoice.name,
      amount: invoice.outstandingAmount,
    });

    if (doc.amount!.isZero()) {
      continue;
    }

    payments.push(doc);
  }

  return payments;
}

function getSalesInvoiceDates(years: number, baseCount: number): Date[] {
  const dates: Date[] = [];
  for (const months of range(0, years * 12)) {
    const flow = getFlowConstant(months);
    const count = Math.ceil(flow * baseCount * (Math.random() * 0.25 + 0.75));
    dates.push(...getRandomDates(count, months));
  }

  return dates;
}

async function getSalesInvoices(
  fyo: Fyo,
  years: number,
  baseCount: number,
  notifier?: Notifier
) {
  const invoices: SalesInvoice[] = [];
  const salesItems = items.filter((i) => i.for !== 'Purchases');
  const customers = parties.filter((i) => i.role !== 'Supplier');

  /**
   * Get certain number of entries for each month of the count
   * of years.
   */
  const dates = getSalesInvoiceDates(years, baseCount);

  /**
   * For each date create a Sales Invoice.
   */

  for (let d = 0; d < dates.length; d++) {
    const date = dates[d];

    notifier?.(
      `Creating Sales Invoices, ${d} out of ${dates.length}`,
      safeParseInt(d) / dates.length
    );
    const customer = sample(customers);

    const doc = fyo.doc.getNewDoc(
      ModelNameEnum.SalesInvoice,
      {
        date,
      },
      false
    ) as SalesInvoice;

    await doc.set('party', customer!.name);
    if (!doc.account) {
      doc.account = 'Debtors';
    }
    /**
     * Add `numItems` number of items to the invoice.
     */
    const numItems = Math.ceil(Math.random() * 5);
    for (let i = 0; i < numItems; i++) {
      const item = sample(salesItems);
      if ((doc.items ?? []).find((i) => i.item === item)) {
        continue;
      }

      let quantity = 1;

      /**
       * Increase quantity depending on the rate.
       */
      if (item!.rate < 100 && Math.random() < 0.4) {
        quantity = Math.ceil(Math.random() * 10);
      } else if (item!.rate < 1000 && Math.random() < 0.2) {
        quantity = Math.ceil(Math.random() * 4);
      } else if (Math.random() < 0.01) {
        quantity = Math.ceil(Math.random() * 3);
      }

      let fc = flow[date.getMonth()];
      if (baseCount < 500) {
        fc += 1;
      }
      const rate = fyo.pesa(item!.rate * (fc + 1)).clip(0);
      await doc.append('items', {});
      await doc.items!.at(-1)!.set({
        item: item!.name,
        rate,
        quantity,
        account: item!.incomeAccount,
        amount: rate.mul(quantity),
        tax: item!.tax,
        description: item!.description,
        hsnCode: item!.hsnCode,
      });
    }

    invoices.push(doc);
  }

  return invoices;
}

async function getPurchaseInvoices(
  fyo: Fyo,
  years: number,
  salesInvoices: SalesInvoice[]
): Promise<PurchaseInvoice[]> {
  return [
    await getSalesPurchaseInvoices(fyo, salesInvoices),
    await getNonSalesPurchaseInvoices(fyo, years),
  ].flat();
}

async function getSalesPurchaseInvoices(
  fyo: Fyo,
  salesInvoices: SalesInvoice[]
): Promise<PurchaseInvoice[]> {
  const invoices = [] as PurchaseInvoice[];
  /**
   * Group all sales invoices by their YYYY-MM.
   */
  const dateGrouped = salesInvoices
    .map((si) => {
      const date = DateTime.fromJSDate(si.date as Date);
      const key = `${date.year}-${String(date.month).padStart(2, '0')}`;
      return { key, si };
    })
    .reduce((acc, item) => {
      acc[item.key] ??= [];
      acc[item.key].push(item.si);
      return acc;
    }, {} as Record<string, SalesInvoice[]>);

  /**
   * Sort the YYYY-MM keys in ascending order.
   */
  const dates = Object.keys(dateGrouped)
    .map((k) => ({ key: k, date: new Date(k) }))
    .sort((a, b) => +a.date - +b.date);
  const purchaseQty: Record<string, number> = {};

  /**
   * For each date create a set of Purchase Invoices.
   */
  for (const { key, date } of dates) {
    /**
     * Group items by name to get the total quantity used in a month.
     */
    const itemGrouped = dateGrouped[key].reduce((acc, si) => {
      for (const item of si.items!) {
        if (item.item === 'Dry-Cleaning') {
          continue;
        }

        acc[item.item as string] ??= 0;
        acc[item.item as string] += item.quantity as number;
      }

      return acc;
    }, {} as Record<string, number>);

    /**
     * Set order quantity for the first of the month.
     */
    Object.keys(itemGrouped).forEach((name) => {
      const quantity = itemGrouped[name];
      purchaseQty[name] ??= 0;
      let prevQty = purchaseQty[name];

      if (prevQty <= quantity) {
        prevQty = quantity - prevQty;
      }

      purchaseQty[name] = Math.ceil(prevQty / 10) * 10;
    });

    const supplierGrouped = Object.keys(itemGrouped).reduce((acc, item) => {
      const supplier = purchaseItemPartyMap[item];
      acc[supplier] ??= [];
      acc[supplier].push(item);

      return acc;
    }, {} as Record<string, string[]>);

    /**
     * For each supplier create a Purchase Invoice
     */
    for (const supplier in supplierGrouped) {
      const doc = fyo.doc.getNewDoc(
        ModelNameEnum.PurchaseInvoice,
        {
          date,
        },
        false
      ) as PurchaseInvoice;

      await doc.set('party', supplier);
      if (!doc.account) {
        doc.account = 'Creditors';
      }

      /**
       * For each item create a row
       */
      for (const item of supplierGrouped[supplier]) {
        await doc.append('items', {});
        const quantity = purchaseQty[item];
        await doc.items!.at(-1)!.set({ item, quantity });
      }

      invoices.push(doc);
    }
  }

  return invoices;
}

async function getNonSalesPurchaseInvoices(
  fyo: Fyo,
  years: number
): Promise<PurchaseInvoice[]> {
  const purchaseItems = items.filter((i) => i.for !== 'Sales');
  const itemMap = getMapFromList(purchaseItems, 'name');
  const periodic: Record<string, number> = {
    'Marketing - Video': 2,
    'Social Ads': 1,
    Electricity: 1,
    'Office Cleaning': 1,
    'Office Rent': 1,
  };
  const invoices: SalesInvoice[] = [];

  for (const months of range(0, years * 12)) {
    /**
     * All purchases on the first of the month.
     */
    const temp = DateTime.now().minus({ months });
    const date = DateTime.local(temp.year, temp.month, 1).toJSDate();

    for (const name in periodic) {
      if (months % periodic[name] !== 0) {
        continue;
      }

      const doc = fyo.doc.getNewDoc(
        ModelNameEnum.PurchaseInvoice,
        {
          date,
        },
        false
      ) as PurchaseInvoice;

      const party = purchaseItemPartyMap[name];
      await doc.set('party', party);
      if (!doc.account) {
        doc.account = 'Creditors';
      }
      await doc.append('items', {});
      const row = doc.items!.at(-1)!;
      const item = itemMap[name];

      let quantity = 1;
      let rate = item.rate;
      if (name === 'Social Ads') {
        quantity = Math.ceil(Math.random() * 200);
      } else if (name !== 'Office Rent') {
        rate = rate * (Math.random() * 0.4 + 0.8);
      }

      await row.set({
        item: item.name,
        quantity,
        rate: fyo.pesa(rate).clip(0),
      });

      invoices.push(doc);
    }
  }

  return invoices;
}

async function generateStaticEntries(fyo: Fyo) {
  await generateItems(fyo);
  await generateParties(fyo);
}

async function generateItems(fyo: Fyo) {
  for (const item of items) {
    const doc = fyo.doc.getNewDoc('Item', item, false);
    await doc.sync();
  }
}

async function generateParties(fyo: Fyo) {
  for (const party of parties) {
    const doc = fyo.doc.getNewDoc('Party', party, false);
    await doc.sync();
  }
}

async function syncAndSubmit(docs: Doc[], notifier?: Notifier) {
  const nameMap: Record<string, string> = {
    [ModelNameEnum.PurchaseInvoice]: t`Invoices`,
    [ModelNameEnum.SalesInvoice]: t`Invoices`,
    [ModelNameEnum.Payment]: t`Payments`,
    [ModelNameEnum.JournalEntry]: t`Journal Entries`,
  };

  const total = docs.length;
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    notifier?.(
      `Syncing ${nameMap[doc.schemaName]}, ${i} out of ${total}`,
      safeParseInt(i) / total
    );
    await doc.sync();
    await doc.submit();
  }
}
