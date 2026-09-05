/**
 * Browser entry point for the Web target. Replaces main.ts/src/renderer/
 * (Electron-only) — see package.json's web build script and vite config.
 *
 * Deliberately does NOT reuse src/renderer.ts as-is: that file calls
 * registerIpcRendererListeners() and ipc.getEnv(), both Electron-only
 * (the `ipc` global comes from Electron's preload script and doesn't
 * exist in a browser). What IS shared with Desktop: App error handling
 * conventions, fyo itself (fyo/index.ts, unchanged), and Tailwind styling.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md (AC-6)
 */
import { createApp } from 'vue';
import { clerkPlugin } from '@clerk/vue';
import { fyo } from 'src/initFyoWeb';
import webRouter from 'src/web/router';
import { setLanguageMap } from 'src/utils/language';
import './src/styles/index.css'; // Tailwind — same design tokens as Desktop, see colors.json

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'VITE_CLERK_PUBLISHABLE_KEY is not set — required for the Web target (see worker/wrangler.toml for the matching CLERK_PUBLISHABLE_KEY Worker secret)'
  );
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const language = fyo.config.get('language') as string;
  if (language) {
    await setLanguageMap(language);
  }
  fyo.store.language = language || 'English';
  fyo.store.platform = 'Web';

  const app = createApp({
    template: '<router-view />',
  });
  app.config.unwrapInjectedRef = true;

  app.use(webRouter);
  app.use(clerkPlugin, {
    publishableKey: PUBLISHABLE_KEY,
    signInFallbackRedirectUrl: '/dashboard',
    signUpFallbackRedirectUrl: '/create-organization',
  });

  app.mixin({
    computed: {
      fyo() {
        return fyo;
      },
      platform() {
        return 'Web';
      },
    },
    methods: {
      t: fyo.t,
      T: fyo.T,
    },
  });

  app.mount('body');
})();
