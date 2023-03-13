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
      style="width: 100%"
    >
      <div id="toast-target" />
    </div>
  </div>
</template>

<script>
import { ConfigKeys } from 'fyo/core/types';
import { RTL_LANGUAGES } from 'fyo/utils/consts';
import { ModelNameEnum } from 'models/types';
import { systemLanguageRef } from 'src/utils/refs';
import { computed } from 'vue';
import WindowsTitleBar from './components/WindowsTitleBar.vue';
import { handleErrorWithDialog } from './errorHandling';
import { fyo } from './initFyo';
import DatabaseSelector from './pages/DatabaseSelector.vue';
import Desk from './pages/Desk.vue';
import SetupWizard from './pages/SetupWizard/SetupWizard.vue';
import setupInstance from './setup/setupInstance';
import './styles/index.css';
import { initializeInstance } from './utils/initialization';
import { checkForUpdates } from './utils/ipcCalls';
import { updateConfigFiles } from './utils/misc';
import { updatePrintTemplates } from './utils/printTemplates';
import { Search } from './utils/search';
import { setGlobalShortcuts } from './utils/shortcuts';
import { routeTo } from './utils/ui';
import { Shortcuts, useKeys } from './utils/vueUtils';

export default {
  name: 'App',
  setup() {
    return { keys: useKeys() };
  },
  data() {
    return {
      activeScreen: null,
      dbPath: '',
      companyName: '',
      searcher: null,
      shortcuts: null,
    };
  },
  provide() {
    return {
      languageDirection: computed(() => this.languageDirection),
      searcher: computed(() => this.searcher),
      shortcuts: computed(() => this.shortcuts),
      keys: computed(() => this.keys),
    };
  },
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector,
    WindowsTitleBar,
  },
  async mounted() {
    const shortcuts = new Shortcuts(this.keys);
    this.shortcuts = shortcuts;
    const lastSelectedFilePath = fyo.config.get(
      ConfigKeys.LastSelectedFilePath,
      null
    );

    if (!lastSelectedFilePath) {
      return (this.activeScreen = 'DatabaseSelector');
    }

    try {
      await this.fileSelected(lastSelectedFilePath, false);
    } catch (err) {
      await handleErrorWithDialog(err, undefined, true, true);
      await this.showDbSelector();
    }

    setGlobalShortcuts(shortcuts);
  },
  computed: {
    language() {
      return systemLanguageRef.value;
    },
    languageDirection() {
      return RTL_LANGUAGES.includes(this.language) ? 'rtl' : 'ltr';
    },
  },
  methods: {
    async setDesk(filePath) {
      this.activeScreen = 'Desk';
      await this.setDeskRoute();
      await fyo.telemetry.start(true);
      await checkForUpdates(false);
      this.dbPath = filePath;
      this.companyName = await fyo.getValue(
        ModelNameEnum.AccountingSettings,
        'companyName'
      );
      await this.setSearcher();
      updateConfigFiles(fyo);
    },
    async setSearcher() {
      this.searcher = new Search(fyo);
      await this.searcher.initializeKeywords();
    },
    async fileSelected(filePath, isNew) {
      fyo.config.set(ConfigKeys.LastSelectedFilePath, filePath);
      if (isNew) {
        this.activeScreen = 'SetupWizard';
        return;
      }
      await this.showSetupWizardOrDesk(filePath);
    },
    async setupComplete(setupWizardOptions) {
      const filePath = fyo.config.get(ConfigKeys.LastSelectedFilePath);
      await setupInstance(filePath, setupWizardOptions, fyo);
      await this.setDesk(filePath);
    },
    async showSetupWizardOrDesk(filePath) {
      const countryCode = await fyo.db.connectToDatabase(filePath);
      const setupComplete = await fyo.getValue(
        ModelNameEnum.AccountingSettings,
        'setupComplete'
      );

      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
        return;
      }

      await initializeInstance(filePath, false, countryCode, fyo);
      await updatePrintTemplates(fyo);
      await this.setDesk(filePath);
    },
    async setDeskRoute() {
      const { onboardingComplete } = await fyo.doc.getDoc('GetStarted');
      const { hideGetStarted } = await fyo.doc.getDoc('SystemSettings');

      if (hideGetStarted || onboardingComplete) {
        routeTo('/');
      } else {
        routeTo('/get-started');
      }
    },
    async showDbSelector() {
      fyo.config.set('lastSelectedFilePath', null);
      fyo.telemetry.stop();
      await fyo.purgeCache();
      this.activeScreen = 'DatabaseSelector';
      this.dbPath = '';
      this.searcher = null;
      this.companyName = '';
    },
  },
};
</script>
