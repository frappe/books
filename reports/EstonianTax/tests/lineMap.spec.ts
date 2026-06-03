import test from 'tape';
import { emptyKmdBody, pickVersion, VAT_CODE_TO_BUCKET } from '../lineMap';

test('lineMap: every VAT code maps to a bucket', (t) => {
  for (const code of Object.keys(VAT_CODE_TO_BUCKET)) {
    const bucket = VAT_CODE_TO_BUCKET[code as keyof typeof VAT_CODE_TO_BUCKET];
    t.ok(bucket, `${code} has bucket`);
  }
  t.end();
});

test('lineMap: ZERO_EU_B2B (goods) feeds line 3 + 3.1 + 3.1.1, VD goods', (t) => {
  const b = VAT_CODE_TO_BUCKET.ZERO_EU_B2B!;
  t.equal(b.primary, 'transactionsZeroVat');
  t.deepEqual(b.also, [
    'euSupplyInclGoodsAndServicesZeroVat',
    'euSupplyGoodsZeroVat',
  ]);
  t.equal(b.vdColumn, 'goods');
  t.end();
});

test('lineMap: ZERO_EU_GOODS feeds 3.1 + 3.1.1, VD goods', (t) => {
  const b = VAT_CODE_TO_BUCKET.ZERO_EU_GOODS!;
  t.deepEqual(b.also, [
    'euSupplyInclGoodsAndServicesZeroVat',
    'euSupplyGoodsZeroVat',
  ]);
  t.equal(b.vdColumn, 'goods');
  t.end();
});

test('lineMap: ZERO_EU_SERVICES feeds 3.1 only (not 3.1.1), VD services', (t) => {
  const b = VAT_CODE_TO_BUCKET.ZERO_EU_SERVICES!;
  t.deepEqual(b.also, ['euSupplyInclGoodsAndServicesZeroVat']);
  t.notOk(
    b.also?.includes('euSupplyGoodsZeroVat'),
    'services excluded from 3.1.1'
  );
  t.equal(b.vdColumn, 'services');
  t.end();
});

test('lineMap: ZERO_EU_TRIANGLE feeds VD triangle only, no KMD line', (t) => {
  const b = VAT_CODE_TO_BUCKET.ZERO_EU_TRIANGLE!;
  t.notOk(b.primary, 'no KMD primary line');
  t.notOk(b.also, 'no KMD also lines');
  t.equal(b.vdColumn, 'triangle');
  t.end();
});

test('lineMap: ZERO_EXPORT feeds line 3 + 3.2', (t) => {
  const b = VAT_CODE_TO_BUCKET.ZERO_EXPORT!;
  t.equal(b.primary, 'transactionsZeroVat');
  t.deepEqual(b.also, ['exportZeroVat']);
  t.end();
});

test('lineMap: EU_RC_GOODS feeds line 6 + 6.1', (t) => {
  const b = VAT_CODE_TO_BUCKET.EU_RC_GOODS!;
  t.equal(b.primary, 'euAcquisitionsGoodsAndServicesTotal');
  t.deepEqual(b.also, ['euAcquisitionsGoods']);
  t.equal(b.side, 'rc-purchase');
  t.equal(b.rate, 24);
  t.end();
});

test('lineMap: NON_EU_RC feeds line 7 only', (t) => {
  const b = VAT_CODE_TO_BUCKET.NON_EU_RC!;
  t.equal(b.primary, 'acquisitionOtherGoodsAndServicesTotal');
  t.notOk(b.also);
  t.end();
});

test('pickVersion: KMD6 from 07.2025+', (t) => {
  t.equal(pickVersion(2025, 7), 'KMD6');
  t.equal(pickVersion(2026, 5), 'KMD6');
  t.equal(pickVersion(2025, 6), 'KMD5');
  t.equal(pickVersion(2025, 1), 'KMD5');
  t.equal(pickVersion(2024, 12), 'KMD4');
  t.equal(pickVersion(2024, 1), 'KMD4');
  t.end();
});

test('emptyKmdBody: all fields start at 0', (t) => {
  const b = emptyKmdBody();
  for (const k of Object.keys(b)) {
    t.equal(b[k as keyof typeof b], 0, `${k} starts at 0`);
  }
  t.end();
});
