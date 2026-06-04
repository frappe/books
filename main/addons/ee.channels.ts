/**
 * CUSTOM — github.com/wemit/books
 *
 * Estonia addon IPC channel names. Namespaced strings owned by the addon so
 * new addon channels never touch the core IPC_ACTIONS enum (utils/messages).
 * Dependency-free on purpose: imported by both the preload and main halves.
 */
export const EE_CHANNELS = {
  detectArelle: 'ee:detect-arelle',
  validateXbrl: 'ee:validate-xbrl',
} as const;
