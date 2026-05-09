/**
 * Tests for the dashboard widget system.
 *
 * Two layers:
 *   1. Pure-function tests for types.ts (no DB, no fyo)
 *   2. Integration tests for the DashboardSettings singleton (in-memory SQLite)
 */

import { ModelNameEnum } from 'models/types';
import {
  ALL_WIDGET_KEYS,
  applyWidgetDrop,
  buildPreviewRows,
  buildWidgetRows,
  DEFAULT_LAYOUT,
  parseWidgetLayout,
  PRESET_PROFILES,
  PROFILE_LAYOUTS,
  profileToLayout,
  WIDGET_META,
  WidgetConfig,
  WidgetKey,
} from 'src/pages/Dashboard/types';
import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from './helpers';

// ── 1. parseWidgetLayout ────────────────────────────────────────────────────

test('parseWidgetLayout: undefined → default layout', (t) => {
  const result = parseWidgetLayout(undefined);
  t.deepEqual(result, DEFAULT_LAYOUT, 'matches DEFAULT_LAYOUT');
  t.notEqual(result, DEFAULT_LAYOUT, 'returns a copy, not the same reference');
  t.end();
});

test('parseWidgetLayout: invalid JSON → default layout', (t) => {
  const result = parseWidgetLayout('not valid json {{');
  t.deepEqual(result, DEFAULT_LAYOUT, 'falls back to DEFAULT_LAYOUT');
  t.end();
});

test('parseWidgetLayout: valid JSON round-trips correctly', (t) => {
  const saved: WidgetConfig[] = [
    { id: 'salesInvoices', visible: true },
    { id: 'cashflow', visible: false },
    { id: 'purchaseInvoices', visible: true },
    { id: 'profitAndLoss', visible: true },
    { id: 'expenses', visible: true },
  ];
  const result = parseWidgetLayout(JSON.stringify(saved));
  t.equal(result[0].id, 'salesInvoices', 'order preserved');
  t.equal(result[1].visible, false, 'visibility preserved');
  t.end();
});

test('parseWidgetLayout: forward-compat — unknown ids in saved are kept, missing keys are appended', (t) => {
  // Simulate a save that is missing 'expenses' (added in a later release)
  const partialSave: WidgetConfig[] = ALL_WIDGET_KEYS.filter(
    (id) => id !== 'expenses'
  ).map((id) => ({ id, visible: true }));

  const result = parseWidgetLayout(JSON.stringify(partialSave));
  const resultIds = result.map((c) => c.id);

  t.ok(resultIds.includes('expenses'), "'expenses' appended when missing");
  t.equal(
    result.find((c) => c.id === 'expenses')?.visible,
    true,
    'newly-appended widget defaults to visible'
  );
  t.equal(
    result.length,
    ALL_WIDGET_KEYS.length,
    'length matches ALL_WIDGET_KEYS'
  );
  t.end();
});

// ── 2. profileToLayout ──────────────────────────────────────────────────────

test('profileToLayout: every preset contains all widget keys', (t) => {
  for (const profile of PRESET_PROFILES) {
    const layout = profileToLayout(profile);
    const ids = layout.map((c) => c.id);
    t.equal(
      ids.length,
      ALL_WIDGET_KEYS.length,
      `${profile}: layout has all keys`
    );
    for (const key of ALL_WIDGET_KEYS) {
      t.ok(ids.includes(key), `${profile}: contains '${key}'`);
    }
  }
  t.end();
});

test('profileToLayout: visible widgets come first, in profile order', (t) => {
  for (const profile of PRESET_PROFILES) {
    const layout = profileToLayout(profile);
    const visibleIds = layout.filter((c) => c.visible).map((c) => c.id);
    t.deepEqual(
      visibleIds,
      PROFILE_LAYOUTS[profile],
      `${profile}: visible order matches PROFILE_LAYOUTS`
    );
  }
  t.end();
});

test('profileToLayout: Freelancer hides Cashflow', (t) => {
  const layout = profileToLayout('Freelancer');
  const cashflow = layout.find((c) => c.id === 'cashflow');
  t.equal(cashflow?.visible, false, 'cashflow hidden for Freelancer');
  t.end();
});

// ── 3. buildWidgetRows ──────────────────────────────────────────────────────

test('buildWidgetRows: empty visible list → no rows', (t) => {
  const rows = buildWidgetRows(
    ALL_WIDGET_KEYS.map((id) => ({ id, visible: false }))
  );
  t.equal(rows.length, 0, 'no rows when all hidden');
  t.end();
});

test('buildWidgetRows: single full-width widget → one full row', (t) => {
  const rows = buildWidgetRows([{ id: 'cashflow', visible: true }]);
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'full');
  if (rows[0].type === 'full') {
    t.equal(rows[0].widget.id, 'cashflow');
  }
  t.end();
});

test('buildWidgetRows: two adjacent half-width widgets → one half-pair row', (t) => {
  const rows = buildWidgetRows([
    { id: 'salesInvoices', visible: true },
    { id: 'purchaseInvoices', visible: true },
  ]);
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'half-pair');
  if (rows[0].type === 'half-pair') {
    t.equal(rows[0].left.id, 'salesInvoices');
    t.equal(rows[0].right.id, 'purchaseInvoices');
  }
  t.end();
});

test('buildWidgetRows: lone half-width widget → half-solo row', (t) => {
  const rows = buildWidgetRows([{ id: 'profitAndLoss', visible: true }]);
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'half-solo');
  if (rows[0].type === 'half-solo') {
    t.equal(rows[0].widget.id, 'profitAndLoss');
  }
  t.end();
});

test('buildWidgetRows: mixed layout builds correct row sequence', (t) => {
  // cashflow (full) + salesInvoices + purchaseInvoices (pair) + profitAndLoss (solo)
  const rows = buildWidgetRows([
    { id: 'cashflow', visible: true },
    { id: 'salesInvoices', visible: true },
    { id: 'purchaseInvoices', visible: true },
    { id: 'profitAndLoss', visible: true },
  ]);
  t.equal(rows.length, 3, 'three rows');
  t.equal(rows[0].type, 'full', 'first row is full');
  t.equal(rows[1].type, 'half-pair', 'second row is half-pair');
  t.equal(rows[2].type, 'half-solo', 'third row is half-solo (unpaired half)');
  t.end();
});

test('buildWidgetRows: hidden widgets are excluded', (t) => {
  const rows = buildWidgetRows([
    { id: 'cashflow', visible: false },
    { id: 'salesInvoices', visible: true },
    { id: 'purchaseInvoices', visible: false },
  ]);
  // cashflow hidden, purchaseInvoices hidden → only salesInvoices visible → half-solo
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'half-solo');
  t.end();
});

// ── 4. WIDGET_META completeness ─────────────────────────────────────────────

test('WIDGET_META: every WidgetKey has a complete entry', (t) => {
  for (const key of ALL_WIDGET_KEYS) {
    const meta = WIDGET_META[key];
    t.ok(meta, `${key}: entry exists`);
    t.ok(meta.label, `${key}: has label`);
    t.ok(meta.description, `${key}: has description`);
    t.ok(meta.width === 'full' || meta.width === 'half', `${key}: valid width`);
    t.equal(typeof meta.wrapClass, 'string', `${key}: wrapClass is a string`);
    t.ok(meta.icon, `${key}: has icon`);
    t.equal(typeof meta.icon, 'string', `${key}: icon is a string`);
  }
  t.end();
});

// ── 5. buildPreviewRows ──────────────────────────────────────────────────────

test('buildPreviewRows: empty list → no rows', (t) => {
  t.deepEqual(buildPreviewRows([]), [], 'empty input gives empty output');
  t.end();
});

test('buildPreviewRows: single full widget → endIdx=1', (t) => {
  const rows = buildPreviewRows(['cashflow']);
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'full');
  t.equal(rows[0].endIdx, 1, 'full row endIdx is 1');
  t.deepEqual(rows[0].ids, ['cashflow']);
  t.end();
});

test('buildPreviewRows: half-pair → endIdx=2', (t) => {
  const rows = buildPreviewRows(['salesInvoices', 'purchaseInvoices']);
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'half-pair');
  t.equal(rows[0].endIdx, 2, 'half-pair row consumes 2 widgets');
  t.deepEqual(rows[0].ids, ['salesInvoices', 'purchaseInvoices']);
  t.end();
});

test('buildPreviewRows: half-solo → endIdx=1', (t) => {
  const rows = buildPreviewRows(['profitAndLoss']);
  t.equal(rows.length, 1);
  t.equal(rows[0].type, 'half-solo');
  t.equal(rows[0].endIdx, 1);
  t.end();
});

test('buildPreviewRows: mixed sequence has correct cumulative endIdx values', (t) => {
  // cashflow(full) | salesInvoices+purchaseInvoices(pair) | profitAndLoss(solo)
  // indices:  0          1              2                       3
  // endIdx:   1                         3                       4
  const rows = buildPreviewRows([
    'cashflow',
    'salesInvoices',
    'purchaseInvoices',
    'profitAndLoss',
  ]);
  t.equal(rows.length, 3);
  t.equal(rows[0].type, 'full');
  t.equal(rows[0].endIdx, 1, 'full endIdx=1');
  t.equal(rows[1].type, 'half-pair');
  t.equal(rows[1].endIdx, 3, 'pair endIdx=3 (consumed 2 slots)');
  t.equal(rows[2].type, 'half-solo');
  t.equal(rows[2].endIdx, 4, 'solo endIdx=4');
  t.end();
});

test('buildPreviewRows: drop at half-solo endIdx pairs the widgets', (t) => {
  // profitAndLoss is alone; dropping expenses at endIdx=1 should make them pair
  const before: WidgetKey[] = ['profitAndLoss'];
  const soloRows = buildPreviewRows(before);
  t.equal(soloRows[0].type, 'half-solo');
  const pairTarget = soloRows[0].endIdx; // = 1

  // Simulate dropping expenses (currently hidden) at that index
  const after = applyWidgetDrop(before, 'expenses', pairTarget);
  t.deepEqual(
    after,
    ['profitAndLoss', 'expenses'],
    'expenses inserted after solo'
  );

  const afterRows = buildPreviewRows(after);
  t.equal(afterRows.length, 1, 'now a single row');
  t.equal(afterRows[0].type, 'half-pair', 'they now form a half-pair');
  t.end();
});

// ── 6. applyWidgetDrop ───────────────────────────────────────────────────────

test('applyWidgetDrop: inserting a hidden widget at the start', (t) => {
  const result = applyWidgetDrop(
    ['salesInvoices', 'profitAndLoss'],
    'cashflow',
    0
  );
  t.deepEqual(result, ['cashflow', 'salesInvoices', 'profitAndLoss']);
  t.end();
});

test('applyWidgetDrop: inserting a hidden widget in the middle', (t) => {
  const result = applyWidgetDrop(
    ['cashflow', 'profitAndLoss'],
    'salesInvoices',
    1
  );
  t.deepEqual(result, ['cashflow', 'salesInvoices', 'profitAndLoss']);
  t.end();
});

test('applyWidgetDrop: inserting a hidden widget at the end', (t) => {
  const result = applyWidgetDrop(
    ['cashflow', 'salesInvoices'],
    'profitAndLoss',
    2
  );
  t.deepEqual(result, ['cashflow', 'salesInvoices', 'profitAndLoss']);
  t.end();
});

test('applyWidgetDrop: moving a widget earlier (from index 2 to 0)', (t) => {
  const order: WidgetKey[] = ['salesInvoices', 'profitAndLoss', 'cashflow'];
  const result = applyWidgetDrop(order, 'cashflow', 0);
  t.deepEqual(result, ['cashflow', 'salesInvoices', 'profitAndLoss']);
  t.end();
});

test('applyWidgetDrop: moving a widget later (from index 0 to last)', (t) => {
  const order: WidgetKey[] = ['cashflow', 'salesInvoices', 'profitAndLoss'];
  // targetIdx=3 means "after all three"; after removal of cashflow at 0,
  // the array has length 2 and targetIdx adjusts to 2.
  const result = applyWidgetDrop(order, 'cashflow', 3);
  t.deepEqual(result, ['salesInvoices', 'profitAndLoss', 'cashflow']);
  t.end();
});

test('applyWidgetDrop: dropping at the same position is a no-op', (t) => {
  const order: WidgetKey[] = ['cashflow', 'salesInvoices', 'profitAndLoss'];
  // Dropping cashflow at idx=0 (before itself): currentIdx=0, targetIdx=0.
  // After splice(0,1): order=['salesInvoices','profitAndLoss'], currentIdx(0) is NOT < targetIdx(0),
  // so no adjustment; splice(0,0,'cashflow') → ['cashflow','salesInvoices','profitAndLoss']
  const result = applyWidgetDrop(order, 'cashflow', 0);
  t.deepEqual(
    result,
    ['cashflow', 'salesInvoices', 'profitAndLoss'],
    'order unchanged'
  );
  t.end();
});

test('applyWidgetDrop: dropping widget at its own endIdx is also a no-op', (t) => {
  // cashflow is at index 0, endIdx of its row = 1.
  // Dropping at 1: currentIdx=0, after removal targetIdx adjusts to 0 (0 < 1 → 1-1=0),
  // then splice(0,0,'cashflow') → same order.
  const order: WidgetKey[] = ['cashflow', 'salesInvoices'];
  const result = applyWidgetDrop(order, 'cashflow', 1);
  t.deepEqual(
    result,
    ['cashflow', 'salesInvoices'],
    'same order when dropped just after self'
  );
  t.end();
});

test('applyWidgetDrop: does not mutate the original array', (t) => {
  const original: WidgetKey[] = ['cashflow', 'salesInvoices', 'profitAndLoss'];
  const copy = [...original];
  applyWidgetDrop(original, 'cashflow', 2);
  t.deepEqual(original, copy, 'original array is unchanged');
  t.end();
});

// ── 7. Integration: DashboardSettings singleton in an in-memory DB ──────────

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('DashboardSettings: schema is registered', (t) => {
  t.ok(
    fyo.schemaMap[ModelNameEnum.DashboardSettings],
    'schema exists in schemaMap'
  );
  t.equal(
    fyo.schemaMap[ModelNameEnum.DashboardSettings]?.isSingle,
    true,
    'schema is a singleton'
  );
  t.end();
});

test('DashboardSettings: getDoc returns a doc with correct defaults', async (t) => {
  const doc = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
  t.equal(
    doc.schemaName,
    ModelNameEnum.DashboardSettings,
    'schemaName matches'
  );
  t.equal(
    doc.activeProfile ?? 'Custom',
    'Custom',
    'activeProfile defaults to Custom'
  );
  t.equal(doc.widgetLayout, undefined, 'widgetLayout starts as undefined');
  t.end();
});

test('DashboardSettings: setMultiple + sync persists values', async (t) => {
  const layout: WidgetConfig[] = profileToLayout('Freelancer');
  const doc = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);

  await doc.setMultiple({
    widgetLayout: JSON.stringify(layout),
    activeProfile: 'Freelancer',
  });
  await doc.sync();

  // Re-fetch (cache will return the same doc, but values are updated)
  const reloaded = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
  t.equal(reloaded.activeProfile, 'Freelancer', 'activeProfile persisted');
  t.ok(reloaded.widgetLayout, 'widgetLayout was saved');

  const parsed = parseWidgetLayout(reloaded.widgetLayout as string);
  const visibleIds = parsed.filter((c) => c.visible).map((c) => c.id);
  t.deepEqual(
    visibleIds,
    PROFILE_LAYOUTS['Freelancer'],
    'parsed layout matches Freelancer profile'
  );
  t.end();
});

test('DashboardSettings: saving Custom layout round-trips correctly', async (t) => {
  const customLayout: WidgetConfig[] = [
    { id: 'profitAndLoss', visible: true },
    { id: 'cashflow', visible: false },
    { id: 'salesInvoices', visible: true },
    { id: 'purchaseInvoices', visible: false },
    { id: 'expenses', visible: true },
  ];

  const doc = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
  await doc.setMultiple({
    widgetLayout: JSON.stringify(customLayout),
    activeProfile: 'Custom',
  });
  await doc.sync();

  const reloaded = await fyo.doc.getDoc(ModelNameEnum.DashboardSettings);
  const parsed = parseWidgetLayout(reloaded.widgetLayout as string);

  t.equal(parsed[0].id, 'profitAndLoss', 'custom order preserved (first)');
  t.equal(parsed[1].visible, false, 'cashflow still hidden');
  t.equal(reloaded.activeProfile, 'Custom', 'profile is Custom');
  t.end();
});

closeTestFyo(fyo, __filename);
