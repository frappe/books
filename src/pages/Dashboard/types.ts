// ── Widget identity ─────────────────────────────────────────────────────────
export type WidgetKey =
  | 'cashflow'
  | 'salesInvoices'
  | 'purchaseInvoices'
  | 'profitAndLoss'
  | 'expenses'
  | 'overdueInvoices'
  | 'upcomingBills'
  | 'cashOnHand'
  | 'topCustomers'
  | 'grossMargin';

export type DashboardProfile =
  | 'Freelancer'
  | 'Shop / Trader'
  | 'Small Business'
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
  /** Feather icon name shown in the customize panel. */
  icon: string;
}

export const WIDGET_META: Record<WidgetKey, WidgetMeta> = {
  cashflow: {
    id: 'cashflow',
    label: 'Cashflow',
    description: 'Monthly inflow and outflow',
    width: 'full',
    wrapClass: 'p-4',
    icon: 'trending-up',
  },
  salesInvoices: {
    id: 'salesInvoices',
    label: 'Sales Invoices',
    description: 'Paid and unpaid sales invoices',
    width: 'half',
    wrapClass: '', // UnpaidInvoices applies its own p-4
    icon: 'file-text',
  },
  purchaseInvoices: {
    id: 'purchaseInvoices',
    label: 'Purchase Invoices',
    description: 'Paid and unpaid purchase invoices',
    width: 'half',
    wrapClass: '', // UnpaidInvoices applies its own p-4
    icon: 'shopping-cart',
  },
  profitAndLoss: {
    id: 'profitAndLoss',
    label: 'Profit & Loss',
    description: 'Net income by period',
    width: 'half',
    wrapClass: 'p-4',
    icon: 'bar-chart-2',
  },
  expenses: {
    id: 'expenses',
    label: 'Top Expenses',
    description: 'Top expense categories',
    width: 'half',
    wrapClass: 'p-4',
    icon: 'pie-chart',
  },
  overdueInvoices: {
    id: 'overdueInvoices',
    label: 'Overdue Invoices',
    description: 'Sales invoices overdue by 30+ days',
    width: 'half',
    wrapClass: '',
    icon: 'alert-circle',
  },
  upcomingBills: {
    id: 'upcomingBills',
    label: 'Upcoming Bills',
    description: 'Unpaid purchase invoices from last 30 days',
    width: 'half',
    wrapClass: '',
    icon: 'clock',
  },
  cashOnHand: {
    id: 'cashOnHand',
    label: 'Cash on Hand',
    description: 'Total balance across cash & bank accounts',
    width: 'half',
    wrapClass: 'p-4',
    icon: 'dollar-sign',
  },
  topCustomers: {
    id: 'topCustomers',
    label: 'Top Customers',
    description: 'Top 5 customers by revenue this period',
    width: 'half',
    wrapClass: '',
    icon: 'users',
  },
  grossMargin: {
    id: 'grossMargin',
    label: 'Gross Margin',
    description: 'Revenue minus cost of goods sold (%)',
    width: 'half',
    wrapClass: 'p-4',
    icon: 'percent',
  },
};

export const ALL_WIDGET_KEYS: WidgetKey[] = [
  'cashflow',
  'salesInvoices',
  'purchaseInvoices',
  'profitAndLoss',
  'expenses',
  'overdueInvoices',
  'upcomingBills',
  'cashOnHand',
  'topCustomers',
  'grossMargin',
];

// ── Stored config shape ──────────────────────────────────────────────────────
export interface WidgetConfig {
  id: WidgetKey;
  visible: boolean;
}

const ORIGINAL_WIDGET_KEYS = new Set<WidgetKey>([
  'cashflow',
  'salesInvoices',
  'purchaseInvoices',
  'profitAndLoss',
  'expenses',
]);

export const DEFAULT_LAYOUT: WidgetConfig[] = ALL_WIDGET_KEYS.map((id) => ({
  id,
  visible: ORIGINAL_WIDGET_KEYS.has(id),
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
  // Freelancers are AR-anxious: solo income earners whose #1 concern is
  // getting paid and knowing they can cover upcoming bills. grossMargin is
  // omitted — pure service providers have no COGS, so it reads 100% or empty.
  Freelancer: [
    'cashOnHand',
    'salesInvoices',
    'overdueInvoices',
    'upcomingBills',
    'profitAndLoss',
  ],
  // Shop / Trader: anyone who buys things to sell things (retailer, wholesaler,
  // small manufacturer, trader). The buy-sell cycle makes gross margin and
  // purchase tracking the core need, alongside cashflow for stock funding.
  'Shop / Trader': [
    'cashflow',
    'cashOnHand',
    'grossMargin',
    'salesInvoices',
    'purchaseInvoices',
    'upcomingBills',
    'expenses',
  ],
  // Small Business: any multi-person operation that needs the full financial
  // picture — agency, firm, growing shop, contractor company. Prioritises the
  // executive overview: cashflow shape, P&L health, collections, and key clients.
  'Small Business': [
    'cashflow',
    'cashOnHand',
    'profitAndLoss',
    'salesInvoices',
    'overdueInvoices',
    'topCustomers',
    'expenses',
  ],
};

export const PRESET_PROFILES: ReadonlyArray<Exclude<DashboardProfile, 'Custom'>> =
  ['Freelancer', 'Shop / Trader', 'Small Business'];

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

// ── Customizer helpers ───────────────────────────────────────────────────────

/**
 * The discriminated row shape used by the drag-and-drop customiser preview.
 * `endIdx` is the insertion index (into the visible-order array) that the
 * drop zone placed *after* this row should target.
 */
export type PreviewRow =
  | { type: 'full'; ids: [WidgetKey]; endIdx: number }
  | { type: 'half-pair'; ids: [WidgetKey, WidgetKey]; endIdx: number }
  | { type: 'half-solo'; ids: [WidgetKey]; endIdx: number };

/**
 * Converts an ordered list of visible widget keys into preview rows,
 * pairing adjacent half-width widgets exactly as the dashboard renderer
 * does, and attaching the drop-zone insertion index for each row.
 */
export function buildPreviewRows(visibleOrder: WidgetKey[]): PreviewRow[] {
  const result: PreviewRow[] = [];
  let i = 0;
  while (i < visibleOrder.length) {
    const id = visibleOrder[i];
    if (WIDGET_META[id].width === 'full') {
      result.push({ type: 'full', ids: [id], endIdx: i + 1 });
      i += 1;
    } else {
      const nextId = visibleOrder[i + 1];
      if (nextId !== undefined && WIDGET_META[nextId].width === 'half') {
        result.push({ type: 'half-pair', ids: [id, nextId], endIdx: i + 2 });
        i += 2;
      } else {
        result.push({ type: 'half-solo', ids: [id], endIdx: i + 1 });
        i += 1;
      }
    }
  }
  return result;
}

/**
 * Pure logic behind the customiser's commitDrop operation.
 *
 * Inserts `draggedId` at `targetIdx` in `visibleOrder`.  If the widget was
 * already visible, it is first removed from its current position, and
 * `targetIdx` is adjusted so the final position matches the user's intent.
 * If it was hidden (not present in `visibleOrder`), it is simply inserted.
 */
export function applyWidgetDrop(
  visibleOrder: WidgetKey[],
  draggedId: WidgetKey,
  targetIdx: number
): WidgetKey[] {
  const order = [...visibleOrder];
  const currentIdx = order.indexOf(draggedId);
  if (currentIdx !== -1) {
    order.splice(currentIdx, 1);
    // Removal shifts every subsequent index left by 1.
    if (currentIdx < targetIdx) targetIdx--;
  }
  order.splice(targetIdx, 0, draggedId);
  return order;
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
