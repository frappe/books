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
  buildWidgetRows,
  DEFAULT_LAYOUT,
  parseWidgetLayout,
  PRESET_PROFILES,
  PROFILE_LAYOUTS,
  profileToLayout,
  WIDGET_META,
  WidgetConfig,
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
  }
  t.end();
});

// ── 5. Integration: DashboardSettings singleton in an in-memory DB ──────────

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
