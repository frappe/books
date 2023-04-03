<template>
  <div
    id="app"
    class="h-screen flex flex-col font-sans overflow-hidden antialiased"
    :dir="languageDirection"
    :language="language"
  >
    <WindowsTitleBar
      v-if="platform === 'Windows'"
      :db-path="dbPath"
      :company-name="companyName"
    />
    <!-- Main Contents -->
    <Desk
      class="flex-1"
      v-if="activeScreen === 'Desk'"
      @change-db-file="showDbSelector"
    />
    <DatabaseSelector
      ref="databaseSelector"
      v-if="activeScreen === 'DatabaseSelector'"
      @file-selected="fileSelected"
    />
    <SetupWizard
      v-if="activeScreen === 'SetupWizard'"
      @setup-complete="setupComplete"
      @setup-canceled="showDbSelector"
    />

    <!-- Render target for toasts -->
    <div
      id="toast-container"
      class="absolute bottom-0 flex flex-col items-end mb-3 pe-6"
      style="width: 100%; pointer-events: none"
    ></div>
  </div>
</template>
<script lang="ts">
import { ConfigKeys } from 'fyo/core/types';
import { RTL_LANGUAGES } from 'fyo/utils/consts';
import { ModelNameEnum } from 'models/types';
import { systemLanguageRef } from 'src/utils/refs';
import { defineComponent, provide, ref, Ref } from 'vue';
import WindowsTitleBar from './components/WindowsTitleBar.vue';
import { handleErrorWithDialog } from './errorHandling';
import { fyo } from './initFyo';
import DatabaseSelector from './pages/DatabaseSelector.vue';
import Desk from './pages/Desk.vue';
import SetupWizard from './pages/SetupWizard/SetupWizard.vue';
import setupInstance from './setup/setupInstance';
import { SetupWizardOptions } from './setup/types';
import './styles/index.css';
import { connectToDatabase, dbErrorActionSymbols } from './utils/db';
import { initializeInstance } from './utils/initialization';
import * as injectionKeys from './utils/injectionKeys';
import { checkForUpdates } from './utils/ipcCalls';
import { updateConfigFiles } from './utils/misc';
import { updatePrintTemplates } from './utils/printTemplates';
import { Search } from './utils/search';
import { Shortcuts } from './utils/shortcuts';
import { routeTo } from './utils/ui';
import { useKeys } from './utils/vueUtils';

enum Screen {
  Desk = 'Desk',
  DatabaseSelector = 'DatabaseSelector',
  SetupWizard = 'SetupWizard',
}

export default defineComponent({
  name: 'App',
  setup() {
    const keys = useKeys();
    const searcher: Ref<null | Search> = ref(null);
    const shortcuts = new Shortcuts(keys);
    const languageDirection = ref(
      getLanguageDirection(systemLanguageRef.value)
    );

    provide(injectionKeys.keysKey, keys);
    provide(injectionKeys.searcherKey, searcher);
    provide(injectionKeys.shortcutsKey, shortcuts);
    provide(injectionKeys.languageDirectionKey, languageDirection);

    const databaseSelector = ref<InstanceType<typeof DatabaseSelector> | null>(
      null
    );

    return {
      keys,
      searcher,
      shortcuts,
      languageDirection,
      databaseSelector,
    };
  },
  data() {
    return {
      activeScreen: null,
      dbPath: '',
      companyName: '',
    } as {
      activeScreen: null | Screen;
      dbPath: string;
      companyName: string;
    };
  },
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector,
    WindowsTitleBar,
  },
  async mounted() {
    this.setInitialScreen();
  },
  watch: {
    language(value) {
      this.languageDirection = getLanguageDirection(value);
    },
  },
  computed: {
    language(): string {
      return systemLanguageRef.value;
    },
  },
  methods: {
    async setInitialScreen(): Promise<void> {
      const lastSelectedFilePath = fyo.config.get(
        ConfigKeys.LastSelectedFilePath,
        null
      );

      if (
        typeof lastSelectedFilePath !== 'string' ||
        !lastSelectedFilePath.length
      ) {
        this.activeScreen = Screen.DatabaseSelector;
        return;
      }

      await this.fileSelected(lastSelectedFilePath, false);
    },
    async setSearcher(): Promise<void> {
      this.searcher = new Search(fyo);
      await this.searcher.initializeKeywords();
    },
    async setDesk(filePath: string): Promise<void> {
      this.activeScreen = Screen.Desk;
      await this.setDeskRoute();
      await fyo.telemetry.start(true);
      await checkForUpdates();
      this.dbPath = filePath;
      this.companyName = (await fyo.getValue(
        ModelNameEnum.AccountingSettings,
        'companyName'
      )) as string;
      await this.setSearcher();
      updateConfigFiles(fyo);
    },
    async fileSelected(filePath: string, isNew?: boolean): Promise<void> {
      fyo.config.set(ConfigKeys.LastSelectedFilePath, filePath);
      if (isNew) {
        this.activeScreen = Screen.SetupWizard;
        return;
      }

      try {
        await this.showSetupWizardOrDesk(filePath);
      } catch (error) {
        await handleErrorWithDialog(error, undefined, true, true);
        await this.showDbSelector();
      }
    },
    async setupComplete(setupWizardOptions: SetupWizardOptions): Promise<void> {
      const filePath = fyo.config.get(ConfigKeys.LastSelectedFilePath);
      if (typeof filePath !== 'string') {
        return;
      }

      await setupInstance(filePath, setupWizardOptions, fyo);
      await this.setDesk(filePath);
    },
    async showSetupWizardOrDesk(filePath: string): Promise<void> {
      const { countryCode, error, actionSymbol } = await connectToDatabase(
        this.fyo,
        filePath
      );

      if (!countryCode && error && actionSymbol) {
        return await this.handleConnectionFailed(error, actionSymbol);
      }

      const setupComplete = await fyo.getValue(
        ModelNameEnum.AccountingSettings,
        'setupComplete'
      );

      if (!setupComplete) {
        this.activeScreen = Screen.SetupWizard;
        return;
      }

      await initializeInstance(filePath, false, countryCode, fyo);
      await updatePrintTemplates(fyo);
      await this.setDesk(filePath);
    },
    async handleConnectionFailed(error: Error, actionSymbol: symbol) {
      await this.showDbSelector();

      if (actionSymbol === dbErrorActionSymbols.CancelSelection) {
        return;
      }

      if (actionSymbol === dbErrorActionSymbols.SelectFile) {
        return await this.databaseSelector?.existingDatabase();
      }

      throw error;
    },
    async setDeskRoute(): Promise<void> {
      const { onboardingComplete } = await fyo.doc.getDoc('GetStarted');
      const { hideGetStarted } = await fyo.doc.getDoc('SystemSettings');

      if (hideGetStarted || onboardingComplete) {
        routeTo('/');
      } else {
        routeTo('/get-started');
      }
    },
    async showDbSelector(): Promise<void> {
      fyo.config.set('lastSelectedFilePath', null);
      fyo.telemetry.stop();
      await fyo.purgeCache();
      this.activeScreen = Screen.DatabaseSelector;
      this.dbPath = '';
      this.searcher = null;
      this.companyName = '';
    },
  },
});

function getLanguageDirection(language: string): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
}
</script>
