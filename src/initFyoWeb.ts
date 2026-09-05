import { Fyo } from 'fyo';

/**
 * Global fyo for the Web target (rendererWeb.ts). Mirrors src/initFyo.ts
 * exactly except isElectron, which is what routes fyo/demux/*.ts to their
 * fetch()-based web branch instead of ipc calls — see fyo/demux/db.ts.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md (AC-6)
 */
export const fyo = new Fyo({ isTest: false, isElectron: false });
