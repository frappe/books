import { CUSTOM_EVENTS } from 'utils/messages';
import { UnexpectedLogObject } from 'utils/types';
import { App as VueApp, createApp } from 'vue';
import App from './App.vue';
import Badge from './components/Badge.vue';
import FeatherIcon from './components/FeatherIcon.vue';
import { handleError, sendError } from './errorHandling';
import { fyo } from './initFyo';
import { outsideClickDirective } from './renderer/helpers';
import registerIpcRendererListeners from './renderer/registerIpcRendererListeners';
import router from './router';
import { stringifyCircular } from './utils';
import { setLanguageMap } from './utils/language';
import { setDarkMode } from './utils/theme';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const language = fyo.config.get('language') as string;
  if (language) {
    await setLanguageMap(language);
  }
  fyo.store.language = language || 'English';

  const darkMode = fyo.config.get('darkMode') as boolean;
  setDarkMode(darkMode);

  registerIpcRendererListeners();
  const { isDevelopment, platform, version } = await ipc.getEnv();

  fyo.store.isDevelopment = isDevelopment;
  fyo.store.appVersion = version;
  fyo.store.platform = platform;
  const platformName = getPlatformName(platform);

  setOnWindow(isDevelopment);

  const app = createApp({
    template: '<App/>',
  });
  app.config.unwrapInjectedRef = true;
  setErrorHandlers(app);

  app.use(router);
  app.component('App', App);
  app.component('FeatherIcon', FeatherIcon);
  app.component('Badge', Badge);
  app.directive('on-outside-click', outsideClickDirective);
  app.mixin({
    computed: {
      fyo() {
        return fyo;
      },
      platform() {
        return platformName;
      },
    },
    methods: {
      t: fyo.t,
      T: fyo.T,
    },
  });

  await fyo.telemetry.logOpened();
  app.mount('body');
})();

function setErrorHandlers(app: VueApp) {
  window.onerror = (message, source, lineno, colno, error) => {
    error = error ?? new Error('triggered in window.onerror');
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleError(true, error, { message, source, lineno, colno });
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    let error: Error;
    if (event.reason instanceof Error) {
      error = event.reason;
    } else {
      error = new Error(String(event.reason));
    }

    // eslint-disable-next-line no-console
    handleError(true, error).catch((err) => console.error(err));
  };

  window.addEventListener(CUSTOM_EVENTS.LOG_UNEXPECTED, (event) => {
    const details = (event as CustomEvent)?.detail as UnexpectedLogObject;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sendError(details);
  });

  app.config.errorHandler = (err, vm, info) => {
    const more: Record<string, unknown> = {
      info,
    };

    if (vm) {
      const { fullPath, params } = vm.$route;
      more.fullPath = fullPath;
      more.params = stringifyCircular(params ?? {});
      more.props = stringifyCircular(vm.$props ?? {}, true, true);
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleError(false, err as Error, more);
    // eslint-disable-next-line no-console
    console.error(err, vm, info);
  };
}

function setOnWindow(isDevelopment: boolean) {
  if (!isDevelopment) {
    return;
  }

  // @ts-ignore
  window.router = router;
  // @ts-ignore
  window.fyo = fyo;
}

function getPlatformName(platform: string) {
  switch (platform) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'Mac';
    case 'linux':
      return 'Linux';
    default:
      return 'Linux';
  }
}
