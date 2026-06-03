import test from 'tape';
import { exportKmdXml } from '../KmdXmlExporter';
import { emptyKmdBody } from '../lineMap';
import { KmdReportData } from '../types';

function baseData(): KmdReportData {
  return {
    taxPayerRegCode: '12345678',
    year: 2026,
    month: 5,
    version: 'KMD6',
    declarationType: 1,
    body: emptyKmdBody(),
    saleAnnex: [],
    purchaseAnnex: [],
  };
}

test('xml: emits root + required fields in schema order', (t) => {
  const xml = exportKmdXml(baseData());
  t.ok(xml.startsWith('<?xml'), 'XML prolog present');
  t.ok(xml.includes('<vatDeclaration>'), 'root element');
  const order = [
    'taxPayerRegCode',
    'year',
    'month',
    'declarationType',
    'version',
    'declarationBody',
    'salesAnnex',
    'purchasesAnnex',
  ];
  let cursor = 0;
  for (const el of order) {
    const idx = xml.indexOf(`<${el}`, cursor);
    t.notEqual(idx, -1, `<${el}> present`);
    cursor = idx;
  }
  t.end();
});

test('xml: monetary fields formatted to 2 decimals', (t) => {
  const d = baseData();
  d.body.transactions24 = 1234.5;
  d.body.inputVatTotal = 296.28;
  const xml = exportKmdXml(d);
  t.ok(xml.includes('<transactions24>1234.50</transactions24>'));
  t.ok(xml.includes('<inputVatTotal>296.28</inputVatTotal>'));
  t.end();
});

test('xml: zero monetary values are omitted', (t) => {
  const d = baseData();
  d.body.transactions24 = 100;
  const xml = exportKmdXml(d);
  t.ok(xml.includes('<transactions24>'), 'non-zero kept');
  t.notOk(xml.includes('<transactions9>'), 'zero omitted');
  t.notOk(xml.includes('<transactions13>'), 'zero omitted');
  t.end();
});

test('xml: noSales/noPurchases flags reflect body totals', (t) => {
  const d = baseData();
  let xml = exportKmdXml(d);
  t.ok(xml.includes('<noSales>true</noSales>'));
  t.ok(xml.includes('<noPurchases>true</noPurchases>'));

  d.body.transactions24 = 500;
  xml = exportKmdXml(d);
  t.ok(xml.includes('<noSales>false</noSales>'));
  t.end();
});

test('xml: sumPerPartner flags are false (invoice-by-invoice, not aggregate)', (t) => {
  const xml = exportKmdXml(baseData());
  t.ok(xml.includes('<sumPerPartnerSales>false</sumPerPartnerSales>'));
  t.ok(xml.includes('<sumPerPartnerPurchases>false</sumPerPartnerPurchases>'));
  t.notOk(xml.includes('>true</sumPerPartnerSales>'), 'no aggregate-basis assertion');
  t.end();
});

test('xml: month padded to 2 digits', (t) => {
  const d = baseData();
  d.month = 3;
  const xml = exportKmdXml(d);
  t.ok(xml.includes('<month>03</month>'));
  t.end();
});

test('xml: salesAnnex / purchasesAnnex emit even when empty', (t) => {
  const xml = exportKmdXml(baseData());
  t.ok(xml.includes('<salesAnnex>'));
  t.ok(xml.includes('<purchasesAnnex>'));
  t.end();
});

test('xml: saleLine emits all populated fields', (t) => {
  const d = baseData();
  d.saleAnnex.push({
    buyerRegCode: '10000001',
    buyerName: 'Test OÜ',
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-05-15',
    invoiceSum: 1500,
    taxRate: '24',
  });
  const xml = exportKmdXml(d);
  t.ok(xml.includes('<buyerRegCode>10000001</buyerRegCode>'));
  t.ok(xml.includes('<buyerName>Test OÜ</buyerName>'));
  t.ok(xml.includes('<invoiceSum>1500.00</invoiceSum>'));
  t.ok(xml.includes('<taxRate>24</taxRate>'));
  t.end();
});

test('xml: purchaseLine emits invoiceSumVat + vatInPeriod', (t) => {
  const d = baseData();
  d.purchaseAnnex.push({
    sellerRegCode: '20000002',
    sellerName: 'Supplier OÜ',
    invoiceNumber: 'BILL-007',
    invoiceDate: '2026-05-10',
    invoiceSumVat: 1240,
    vatInPeriod: 240,
  });
  const xml = exportKmdXml(d);
  t.ok(xml.includes('<invoiceSumVat>1240.00</invoiceSumVat>'));
  t.ok(xml.includes('<vatInPeriod>240.00</vatInPeriod>'));
  t.end();
});
