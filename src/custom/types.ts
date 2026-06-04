/**
 * CUSTOM — github.com/wemit/books
 *
 * Renderer-side addon contract. An addon bundles app-level feature
 * contributions (reports, routes, sidebar, per-list actions) behind one
 * manifest. The aggregator (./index.ts) auto-discovers every addon and the
 * core registries spread the aggregated result in once — so adding a new
 * feature means dropping a folder under src/custom/, never editing core.
 *
 * Country-scoped *data* (models, schemas, setup records, COA, settings
 * fields) intentionally stays on upstream's native regional system
 * (getRegionalModels / createRegionalRecords / schemas/regional). This
 * contract is only for the fork-invented aggregation points that upstream
 * offers no hook for.
 */
import type { Fyo } from 'fyo';
import type { Report } from 'reports/Report';
import type { RouteRecordRaw } from 'vue-router';
import type { SidebarRoot } from 'src/utils/types';

/** Constructable report class with the statics the app reads off it. */
export type ReportClass = (new (fyo: Fyo) => Report) & {
  title: string;
  reportName: string;
  isInventory: boolean;
};

export interface AppAddon {
  /** Stable identifier, e.g. 'ee'. */
  name: string;

  /**
   * Optional gate. When present and false for the current company, none of
   * the addon's contributions are registered. Typically a country check.
   */
  condition?: (fyo: Fyo) => boolean;

  /** Report classes keyed by report name (matches reports map keys). */
  reports?: Record<string, ReportClass>;

  /** Extra Vue routes. */
  routes?: RouteRecordRaw[];

  /** Sidebar roots; built lazily so it can read live settings. */
  sidebar?: (fyo: Fyo) => SidebarRoot[];

  /** Extra list-view header actions, keyed by schemaName. */
  listActions?: Record<string, AddonListAction[]>;
}

export interface AddonListAction {
  label: string;
  /** List-level action. Runs with fyo; the list refreshes afterwards. */
  action: (fyo: Fyo) => unknown | Promise<unknown>;
}
