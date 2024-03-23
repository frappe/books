<template>
  <div
    id="app"
    class="dark:bg-gray-900 h-screen flex flex-col font-sans overflow-hidden antialiased"
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
      v-if="activeScreen === 'Desk'"
      class="flex-1"
      :darkMode="darkMode"
      @change-db-file="showDbSelector"
      @toggle-darkmode="toggleDMode"
    />
    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      ref="databaseSelector"
      @new-database="newDatabase"
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
import { showDialog } from './utils/interactive';
import { setLanguageMap } from './utils/language';
import { updateConfigFiles } from './utils/misc';
import { updatePrintTemplates } from './utils/printTemplates';
import { Search } from './utils/search';
import { Shortcuts } from './utils/shortcuts';
import { routeTo } from './utils/ui';
import { useKeys } from './utils/vueUtils';
import { toggleDarkMode } from 'src/utils/theme';

enum Screen {
  Desk = 'Desk',
  DatabaseSelector = 'DatabaseSelector',
  SetupWizard = 'SetupWizard',
}

export default defineComponent({
  name: 'App',
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector,
    WindowsTitleBar,
  },
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
      darkMode: false,
    } as {
      activeScreen: null | Screen;
      dbPath: string;
      companyName: string;
      darkMode: boolean | undefined;
    };
  },
  computed: {
    language(): string {
      return systemLanguageRef.value;
    },
  },
  watch: {
    language(value: string) {
      this.languageDirection = getLanguageDirection(value);
    },
  },
  async mounted() {
    await this.setInitialScreen();
    this.darkMode = fyo.config.get('darkMode') as boolean;
  },
  methods: {
    async setInitialScreen(): Promise<void> {
      const lastSelectedFilePath = fyo.config.get('lastSelectedFilePath', null);

      if (
        typeof lastSelectedFilePath !== 'string' ||
        !lastSelectedFilePath.length
      ) {
        this.activeScreen = Screen.DatabaseSelector;
        return;
      }

      await this.fileSelected(lastSelectedFilePath);
    },
    async setSearcher(): Promise<void> {
      this.searcher = new Search(fyo);
      await this.searcher.initializeKeywords();
    },
    async setDesk(filePath: string): Promise<void> {
      await setLanguageMap();
      this.activeScreen = Screen.Desk;
      await this.setDeskRoute();
      await fyo.telemetry.start(true);
      await ipc.checkForUpdates();
      this.dbPath = filePath;
      this.companyName = (await fyo.getValue(
        ModelNameEnum.AccountingSettings,
        'companyName'
      )) as string;
      await this.setSearcher();
      updateConfigFiles(fyo);
    },
    newDatabase() {
      this.activeScreen = Screen.SetupWizard;
    },
    async fileSelected(filePath: string): Promise<void> {
      fyo.config.set('lastSelectedFilePath', filePath);
      if (filePath !== ':memory:' && !(await ipc.checkDbAccess(filePath))) {
        await showDialog({
          title: this.t`Cannot open file`,
          type: 'error',
          detail: this
            .t`Frappe Books does not have access to the selected file: ${filePath}`,
        });

        fyo.config.set('lastSelectedFilePath', null);
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
      const companyName = setupWizardOptions.companyName;
      const filePath = await ipc.getDbDefaultPath(companyName);
      await setupInstance(filePath, setupWizardOptions, fyo);
      fyo.config.set('lastSelectedFilePath', filePath);
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
        await this.databaseSelector?.existingDatabase();
        return;
      }

      throw error;
    },
    async setDeskRoute(): Promise<void> {
      const { onboardingComplete } = await fyo.doc.getDoc('GetStarted');
      const { hideGetStarted } = await fyo.doc.getDoc('SystemSettings');

      let route = '/get-started';
      if (hideGetStarted || onboardingComplete) {
        route = localStorage.getItem('lastRoute') || '/';
      }

      await routeTo(route);
    },
    async showDbSelector(): Promise<void> {
      localStorage.clear();
      fyo.config.set('lastSelectedFilePath', null);
      fyo.telemetry.stop();
      await fyo.purgeCache();
      this.activeScreen = Screen.DatabaseSelector;
      this.dbPath = '';
      this.searcher = null;
      this.companyName = '';
    },
    async toggleDMode(): Promise<void> {
      toggleDarkMode();
      this.darkMode = fyo.config.get('darkMode');
    },
  },
});

function getLanguageDirection(language: string): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
}
</script>
