import test from 'tape';
import { exportXbrl } from '../XbrlExporter';
import { XbrlReportData } from '../types';

function baseData(): XbrlReportData {
  return {
    registryCode: '12345678',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    year: 2026,
    generalInfo: [],
    balanceSheet: [
      { element: 'CurrentAssets', value: 5000, context: 'instant_end' },
      { element: 'NonCurrentAssets', value: 0, context: 'instant_end' },
      { element: 'CurrentLiabilities', value: 1000, context: 'instant_end' },
      { element: 'NonCurrentLiabilities', value: 0, context: 'instant_end' },
      { element: 'IssuedCapital', value: 2500, context: 'instant_end' },
      { element: 'UnpaidCapital', value: 0, context: 'instant_end' },
      { element: 'Assets', value: 5000, context: 'instant_end' },
      { element: 'Liabilities', value: 1000, context: 'instant_end' },
      { element: 'Equity', value: 4000, context: 'instant_end' },
      { element: 'LiabilitiesAndEquity', value: 5000, context: 'instant_end' },
    ],
    incomeStatement: [
      { element: 'Revenue', value: 10000, context: 'duration_year' },
      { element: 'OtherOperatingExpense', value: 8500, context: 'duration_year' },
      { element: 'TotalProfitLossBeforeTax', value: 1500, context: 'duration_year' },
      { element: 'TotalAnnualPeriodProfitLoss', value: 1500, context: 'duration_year' },
    ],
    notes: [],
  };
}

test('xbrl: declares xbrli + et-gaap namespaces', (t) => {
  const xml = exportXbrl(baseData(), '2026-01-01');
  t.ok(xml.includes('xmlns:xbrli="http://www.xbrl.org/2003/instance"'));
  t.ok(
    xml.includes(
      'xmlns:et-gaap="http://xbrl.eesti.ee/taxonomy/et-gaap_2026-01-01/"'
    )
  );
  t.ok(xml.includes('xmlns:iso4217="http://www.xbrl.org/2003/iso4217"'));
  t.end();
});

test('xbrl: emits instant + duration contexts with RIK scheme', (t) => {
  const xml = exportXbrl(baseData(), '2026-01-01');
  t.ok(xml.includes('<xbrli:context id="instant_end">'));
  t.ok(xml.includes('<xbrli:context id="duration_year">'));
  t.ok(xml.includes('scheme="http://www.rik.ee"'));
  t.ok(xml.includes('<xbrli:identifier scheme="http://www.rik.ee">12345678</xbrli:identifier>'));
  t.ok(xml.includes('<xbrli:instant>2026-12-31</xbrli:instant>'));
  t.ok(xml.includes('<xbrli:startDate>2026-01-01</xbrli:startDate>'));
  t.ok(xml.includes('<xbrli:endDate>2026-12-31</xbrli:endDate>'));
  t.end();
});

test('xbrl: EUR unit declared', (t) => {
  const xml = exportXbrl(baseData(), '2026-01-01');
  t.ok(xml.includes('<xbrli:unit id="EUR">'));
  t.ok(xml.includes('<xbrli:measure>iso4217:EUR</xbrli:measure>'));
  t.end();
});

test('xbrl: monetary facts carry contextRef + unitRef + decimals', (t) => {
  const xml = exportXbrl(baseData(), '2026-01-01');
  t.ok(
    xml.includes(
      '<et-gaap:CurrentAssets contextRef="instant_end" unitRef="EUR" decimals="0">5000</et-gaap:CurrentAssets>'
    )
  );
  t.ok(
    xml.includes(
      '<et-gaap:Revenue contextRef="duration_year" unitRef="EUR" decimals="0">10000</et-gaap:Revenue>'
    )
  );
  t.end();
});

test('xbrl: taxonomy version in namespace', (t) => {
  const xml = exportXbrl(baseData(), '2027-01-01');
  t.ok(xml.includes('et-gaap_2027-01-01'));
  t.end();
});

test('xbrl: balance-equation totals appear', (t) => {
  const xml = exportXbrl(baseData(), '2026-01-01');
  t.ok(xml.includes('<et-gaap:Assets'));
  t.ok(xml.includes('<et-gaap:Liabilities '));
  t.ok(xml.includes('<et-gaap:Equity '));
  t.ok(xml.includes('<et-gaap:LiabilitiesAndEquity'));
  t.end();
});
