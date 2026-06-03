import test from 'tape';
import { exportVdXml } from '../VdXmlExporter';
import { VdReportData } from '../types';

function baseData(): VdReportData {
  return {
    taxPayerRegCode: '12345678',
    year: 2026,
    month: 5,
    lines: [
      {
        partnerCountry: 'FI',
        partnerVatCode: '12345678',
        goods: 1500,
        triangle: 0,
        services: 0,
      },
    ],
  };
}

test('vd: root + header in schema order', (t) => {
  const xml = exportVdXml(baseData());
  t.ok(xml.startsWith('<?xml'), 'prolog');
  t.ok(xml.includes('q1:VD_deklaratsioon'), 'qualified root');
  t.ok(xml.includes('xmlns:q1="http://www.emta.ee/VD/xsd/webimport/v1"'), 'ns');
  const order = ['deklareerijaKood', 'perioodAasta', 'perioodKuu', 'aruandeRead'];
  let cursor = 0;
  for (const el of order) {
    const idx = xml.indexOf(el, cursor);
    t.notEqual(idx, -1, `${el} present and ordered`);
    cursor = idx;
  }
  t.end();
});

test('vd: partner country is @riik attribute, number is element text', (t) => {
  const xml = exportVdXml(baseData());
  t.ok(xml.includes('riik="FI"'), 'country as attribute');
  t.ok(xml.includes('>12345678</kmkrKood>'), 'bare number as text');
  t.notOk(xml.includes('partnerRiik'), 'no invented partnerRiik element');
  t.notOk(xml.includes('<summa>'), 'no invented summa element');
  t.notOk(xml.includes('<kood>'), 'no invented kood element');
  t.end();
});

test('vd: amounts are whole-euro integers in named columns', (t) => {
  const d = baseData();
  d.lines[0] = {
    partnerCountry: 'DE',
    partnerVatCode: '123456789',
    goods: 1000.49,
    triangle: 0,
    services: 250.5,
  };
  const xml = exportVdXml(d);
  t.ok(xml.includes('<kaup>1000</kaup>'), 'goods rounded to integer');
  t.ok(xml.includes('<teenusteMyyk>251</teenusteMyyk>'), 'services rounded');
  t.notOk(/<kaup>[\d-]*\.\d/.test(xml), 'no decimal in goods amount');
  t.notOk(/<teenusteMyyk>[\d-]*\.\d/.test(xml), 'no decimal in services amount');
  t.end();
});

test('vd: zero columns are omitted (minOccurs=0)', (t) => {
  const xml = exportVdXml(baseData());
  t.ok(xml.includes('<kaup>'), 'goods present');
  t.notOk(xml.includes('<teenusteMyyk>'), 'zero services omitted');
  t.notOk(xml.includes('<kolmnurktehing>'), 'zero triangle omitted');
  t.end();
});

test('vd: column order kaup -> kolmnurktehing -> teenusteMyyk', (t) => {
  const d = baseData();
  d.lines[0] = {
    partnerCountry: 'LV',
    partnerVatCode: '40000000',
    goods: 10,
    triangle: 20,
    services: 30,
  };
  const xml = exportVdXml(d);
  const g = xml.indexOf('<kaup>');
  const tr = xml.indexOf('<kolmnurktehing>');
  const s = xml.indexOf('<teenusteMyyk>');
  t.ok(g < tr && tr < s, 'columns in schema order');
  t.end();
});
