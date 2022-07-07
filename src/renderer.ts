import { ipcRenderer } from 'electron';
import { ConfigKeys } from 'fyo/core/types';
import { DateTime } from 'luxon';
import { IPC_ACTIONS } from 'utils/messages';
import { App as VueApp, createApp } from 'vue';
import App from './App.vue';
import Badge from './components/Badge.vue';
import FeatherIcon from './components/FeatherIcon.vue';
import { getErrorHandled, handleError } from './errorHandling';
import { fyo } from './initFyo';
import { outsideClickDirective } from './renderer/helpers';
import registerIpcRendererListeners from './renderer/registerIpcRendererListeners';
import router from './router';
import { stringifyCircular } from './utils';
import { setLanguageMap } from './utils/language';

(async () => {
  const language = fyo.config.get(ConfigKeys.Language) as string;
  if (language) {
    await setLanguageMap(language);
  }

  ipcRenderer.send = getErrorHandled(ipcRenderer.send);
  ipcRenderer.invoke = getErrorHandled(ipcRenderer.invoke);

  registerIpcRendererListeners();
  const { isDevelopment, platform, version } = (await ipcRenderer.invoke(
    IPC_ACTIONS.GET_ENV
  )) as { isDevelopment: boolean; platform: string; version: string };

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

  fyo.telemetry.platform = platformName;
  await fyo.telemetry.logOpened();
  app.mount('body');
})();

function setErrorHandlers(app: VueApp) {
  window.onerror = (message, source, lineno, colno, error) => {
    error = error ?? new Error('triggered in window.onerror');
    handleError(true, error, { message, source, lineno, colno });
  };

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

    handleError(false, err as Error, more);
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
  // @ts-ignore
  window.DateTime = DateTime;
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
