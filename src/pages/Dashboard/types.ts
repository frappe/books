// ── Widget identity ─────────────────────────────────────────────────────────
export type WidgetKey =
  | 'cashflow'
  | 'salesInvoices'
  | 'purchaseInvoices'
  | 'profitAndLoss'
  | 'expenses';

export type DashboardProfile =
  | 'Freelancer'
  | 'Retailer'
  | 'Service Business'
  | 'Custom';

// ── Per-widget metadata ──────────────────────────────────────────────────────
export interface WidgetMeta {
  id: WidgetKey;
  label: string;
  description: string;
  /** 'full' spans the entire row; 'half' widgets pair up side-by-side. */
  width: 'full' | 'half';
  /**
   * CSS class applied to the wrapper <div> in Dashboard.vue.
   * Components with their own internal padding (UnpaidInvoices) leave this empty.
   */
  wrapClass: string;
}

export const WIDGET_META: Record<WidgetKey, WidgetMeta> = {
  cashflow: {
    id: 'cashflow',
    label: 'Cashflow',
    description: 'Monthly inflow and outflow',
    width: 'full',
    wrapClass: 'p-4',
  },
  salesInvoices: {
    id: 'salesInvoices',
    label: 'Sales Invoices',
    description: 'Paid and unpaid sales invoices',
    width: 'half',
    wrapClass: '', // UnpaidInvoices applies its own p-4
  },
  purchaseInvoices: {
    id: 'purchaseInvoices',
    label: 'Purchase Invoices',
    description: 'Paid and unpaid purchase invoices',
    width: 'half',
    wrapClass: '', // UnpaidInvoices applies its own p-4
  },
  profitAndLoss: {
    id: 'profitAndLoss',
    label: 'Profit & Loss',
    description: 'Net income by period',
    width: 'half',
    wrapClass: 'p-4',
  },
  expenses: {
    id: 'expenses',
    label: 'Top Expenses',
    description: 'Top expense categories',
    width: 'half',
    wrapClass: 'p-4',
  },
};

export const ALL_WIDGET_KEYS: WidgetKey[] = [
  'cashflow',
  'salesInvoices',
  'purchaseInvoices',
  'profitAndLoss',
  'expenses',
];

// ── Stored config shape ──────────────────────────────────────────────────────
export interface WidgetConfig {
  id: WidgetKey;
  visible: boolean;
}

export const DEFAULT_LAYOUT: WidgetConfig[] = ALL_WIDGET_KEYS.map((id) => ({
  id,
  visible: true,
}));

// ── Profile presets ──────────────────────────────────────────────────────────
/**
 * Ordered list of visible widget IDs for each built-in profile.
 * Widgets not listed are appended as hidden.
 */
export const PROFILE_LAYOUTS: Record<
  Exclude<DashboardProfile, 'Custom'>,
  WidgetKey[]
> = {
  // Freelancers care about outstanding invoices and overall P&L; cashflow
  // chart is rarely meaningful without regular bank reconciliation.
  Freelancer: ['salesInvoices', 'purchaseInvoices', 'profitAndLoss'],
  // Retailers need tight cashflow visibility alongside both invoice streams.
  Retailer: ['cashflow', 'salesInvoices', 'purchaseInvoices', 'expenses'],
  // Service businesses lead with cashflow and profitability.
  'Service Business': [
    'cashflow',
    'salesInvoices',
    'profitAndLoss',
    'expenses',
  ],
};

export const PRESET_PROFILES: ReadonlyArray<Exclude<DashboardProfile, 'Custom'>> =
  ['Freelancer', 'Retailer', 'Service Business'];

export function profileToLayout(
  profile: Exclude<DashboardProfile, 'Custom'>
): WidgetConfig[] {
  const ordered = PROFILE_LAYOUTS[profile];
  const visibleSet = new Set(ordered);
  return [
    ...ordered.map((id) => ({ id, visible: true })),
    ...ALL_WIDGET_KEYS.filter((id) => !visibleSet.has(id)).map((id) => ({
      id,
      visible: false,
    })),
  ];
}

// ── Serialization ────────────────────────────────────────────────────────────
export function parseWidgetLayout(raw: string | undefined): WidgetConfig[] {
  if (!raw) return DEFAULT_LAYOUT.map((c) => ({ ...c }));
  try {
    const saved = JSON.parse(raw) as WidgetConfig[];
    const savedIds = new Set(saved.map((c) => c.id));
    // Forward-compat: any widget key added after the user last saved gets
    // appended as visible so it doesn't silently disappear.
    const unseen = ALL_WIDGET_KEYS.filter((id) => !savedIds.has(id)).map(
      (id) => ({ id, visible: true })
    );
    return [...saved, ...unseen];
  } catch {
    return DEFAULT_LAYOUT.map((c) => ({ ...c }));
  }
}

// ── Layout engine ────────────────────────────────────────────────────────────
/**
 * Groups the ordered visible-widget list into render rows.
 * Two adjacent half-width widgets form a side-by-side pair; a lone
 * half-width widget spans the full row instead.
 */
export type WidgetRow =
  | { type: 'full'; widget: WidgetConfig }
  | { type: 'half-pair'; left: WidgetConfig; right: WidgetConfig }
  | { type: 'half-solo'; widget: WidgetConfig };

export function buildWidgetRows(configs: WidgetConfig[]): WidgetRow[] {
  const visible = configs.filter((c) => c.visible);
  const rows: WidgetRow[] = [];
  let i = 0;
  while (i < visible.length) {
    const meta = WIDGET_META[visible[i].id];
    if (meta.width === 'full') {
      rows.push({ type: 'full', widget: visible[i] });
      i++;
    } else {
      const next = visible[i + 1];
      if (next && WIDGET_META[next.id].width === 'half') {
        rows.push({ type: 'half-pair', left: visible[i], right: next });
        i += 2;
      } else {
        rows.push({ type: 'half-solo', widget: visible[i] });
        i++;
      }
    }
  }
  return rows;
}
