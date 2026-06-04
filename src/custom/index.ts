/**
 * CUSTOM — github.com/wemit/books
 *
 * Renderer-side addon aggregator. Each addon registers itself here (one line),
 * and the core registries spread the merged getters in. Adding an addon =
 * create src/custom/<name>/index.ts and add it to the `addons` array below —
 * no core files are touched.
 *
 * Country-scoped *data* (models, schemas, setup records, COA, settings fields)
 * intentionally stays on upstream's native regional system; this aggregator is
 * only for fork-invented app-level aggregation points upstream offers no hook
 * for (reports, routes, sidebar, list actions).
 */
import type { Fyo } from 'fyo';
import type { RouteRecordRaw } from 'vue-router';
import type { SidebarRoot } from 'src/utils/types';
import type { AddonListAction, AppAddon, ReportClass } from './types';
import ee from './ee';

export const addons: AppAddon[] = [ee];

function enabled(fyo: Fyo): AppAddon[] {
  return addons.filter((a) => !a.condition || a.condition(fyo));
}

/** Reports keyed by name. Always registered (visibility gated elsewhere). */
export function getAddonReports(): Record<string, ReportClass> {
  return addons.reduce<Record<string, ReportClass>>((acc, a) => {
    return Object.assign(acc, a.reports);
  }, {});
}

/** Routes. Always registered. */
export function getAddonRoutes(): RouteRecordRaw[] {
  return addons.flatMap((a) => a.routes ?? []);
}

/** Sidebar roots from enabled addons. */
export function getAddonSidebar(fyo: Fyo): SidebarRoot[] {
  return enabled(fyo).flatMap((a) => a.sidebar?.(fyo) ?? []);
}

/** List-view header actions for a schema, from enabled addons. */
export function getAddonListActions(
  schemaName: string,
  fyo: Fyo
): AddonListAction[] {
  return enabled(fyo).flatMap((a) => a.listActions?.[schemaName] ?? []);
}
