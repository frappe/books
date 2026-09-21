import { PurchaseInvoice } from 'models/baseModels/PurchaseInvoice/PurchaseInvoice';
import { ModelNameEnum } from 'models/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { getALEs, getItem, getSLEs } from './helpers';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('create receipt valuation fixtures', async () => {
  await fyo.doc.getNewDoc(ModelNameEnum.Location, { name: 'Common' }).sync();
  await fyo.doc
    .getNewDoc(ModelNameEnum.Item, getItem('Taxed stock', 100))
    .sync();
  await fyo.doc
    .getNewDoc(ModelNameEnum.Party, {
      name: 'Stock supplier',
      role: 'Supplier',
    })
    .sync();
  await fyo.doc
    .getNewDoc(ModelNameEnum.Tax, {
      name: 'Receipt tax',
      details: [{ account: 'SGST', rate: 10 }],
    })
    .sync();
});

for (const quantity of [2, 1]) {
  test(`receipt valuation excludes invoice tax for quantity ${quantity}`, async (t) => {
    const invoice = fyo.doc.getNewDoc(ModelNameEnum.PurchaseInvoice, {
      party: 'Stock supplier',
      account: 'Creditors',
      items: [
        {
          item: 'Taxed stock',
          quantity: 2,
          rate: 100,
          tax: 'Receipt tax',
          account: 'Stock Received But Not Billed',
        },
      ],
    }) as PurchaseInvoice;
    await invoice.sync();
    await invoice.submit();
    const invoiceEntries = await getALEs(
      invoice.name!,
      invoice.schemaName,
      fyo
    );
    t.equal(invoice.grandTotal?.float, 220, 'invoice includes tax');
    t.equal(
      Number(invoiceEntries.find((entry) => entry.account === 'SGST')?.debit),
      20,
      'invoice posts tax separately'
    );

    const receipt = (await invoice.getStockTransfer())!;
    await receipt.items![0].set({ quantity, location: 'Common' });
    await receipt.sync();
    const displayedTotal = receipt.grandTotal?.float;
    await receipt.submit();

    const entries = await getALEs(receipt.name!, receipt.schemaName, fyo);
    const stock = await getSLEs(receipt.name!, receipt.schemaName, fyo);
    const stockValue = stock.reduce(
      (total, row) => total + Number(row.rate) * Number(row.quantity),
      0
    );
    t.equal(
      stockValue,
      quantity * 100,
      'stock ledger uses received quantities'
    );
    t.equal(
      Number(entries.find((entry) => entry.account === 'Stock In Hand')?.debit),
      stockValue,
      'accounting inventory value matches the stock ledger'
    );
    t.equal(
      Number(
        entries.find(
          (entry) => entry.account === 'Stock Received But Not Billed'
        )?.credit
      ),
      stockValue,
      'receipt clears only the value of received stock'
    );
    t.equal(
      receipt.grandTotal?.float,
      displayedTotal,
      'display total unchanged'
    );
    t.deepEqual(
      await getALEs(invoice.name!, invoice.schemaName, fyo),
      invoiceEntries,
      'invoice tax and supplier entries unchanged'
    );

    const returned = (await receipt.getReturnDoc())!;
    await returned.sync();
    t.equal(
      (await returned.getPostingAmount()).float,
      -quantity * 100,
      'return valuation keeps the existing sign and excludes tax'
    );
    await returned.delete();

    await receipt.cancel();
    const cancelled = await getALEs(receipt.name!, receipt.schemaName, fyo);
    t.equal(
      cancelled
        .filter((row) => row.account === 'Stock In Hand')
        .reduce(
          (total, row) => total + Number(row.debit) - Number(row.credit),
          0
        ),
      0,
      'cancellation reverses the inventory value'
    );
    t.equal(
      invoice.stockNotTransferred,
      2,
      'cancellation restores unreceived quantity'
    );
  });
}

closeTestFyo(fyo, __filename);
