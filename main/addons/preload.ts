/**
 * CUSTOM — github.com/wemit/books
 *
 * Aggregated preload IPC surface for all main-process addons. Spread into the
 * global `ipc` object in main/preload.ts. Typed as a concrete const so renderer
 * call sites keep full typing (e.g. ipc.ee.validateXbrl). Add an addon =
 * add a namespace here; main/preload.ts is never touched again.
 */
import { eePreload } from './ee.preload';

export const mainAddonPreload = {
  ee: eePreload,
} as const;
