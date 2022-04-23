<template>
  <div
    id="app"
    class="h-screen flex flex-col font-sans overflow-hidden antialiased"
  >
    <WindowsTitleBar v-if="platform === 'Windows'" />
    <!--
    <Desk
      class="flex-1"
      v-if="activeScreen === 'Desk'"
      @change-db-file="changeDbFile"
    />-->
    <div
      v-if="activeScreen === 'Desk'"
      class="h-screen w-screen flex justify-center items-center bg-white"
    >
      <h1>Desk</h1>
    </div>

    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      @file-selected="fileSelected"
    />
    <SetupWizard
      v-if="activeScreen === 'SetupWizard'"
      @setup-complete="setupComplete"
      @setup-canceled="changeDbFile"
    />
    <div
      id="toast-container"
      class="absolute bottom-0 flex flex-col items-end mb-3 pr-6"
      style="width: 100%"
    >
      <div id="toast-target" />
    </div>
    <TelemetryModal />
  </div>
</template>

<script>
import { ConfigKeys } from 'fyo/core/types';
import {
getSetupComplete,
incrementOpenCount,
startTelemetry
} from 'src/utils/misc';
import TelemetryModal from './components/once/TelemetryModal.vue';
import WindowsTitleBar from './components/WindowsTitleBar.vue';
import { fyo, initializeInstance } from './initFyo';
import DatabaseSelector from './pages/DatabaseSelector.vue';
import SetupWizard from './pages/SetupWizard/SetupWizard.vue';
import setupInstance from './setup/setupInstance';
import './styles/index.css';
import { checkForUpdates } from './utils/ipcCalls';
import { routeTo } from './utils/ui';

export default {
  name: 'App',
  data() {
    return {
      activeScreen: null,
    };
  },
  components: {
    // Desk,
    SetupWizard,
    DatabaseSelector,
    WindowsTitleBar,
    TelemetryModal,
  },
  async mounted() {
    fyo.telemetry.platform = this.platform;

    const lastSelectedFilePath = fyo.config.get(
      ConfigKeys.LastSelectedFilePath,
      null
    );

    if (lastSelectedFilePath) {
      await this.fileSelected(lastSelectedFilePath, false);
      return;
    }

    this.activeScreen = 'DatabaseSelector';
  },
  methods: {
    async setDesk() {
      this.activeScreen = 'Desk';
      incrementOpenCount();
      await startTelemetry();
      await checkForUpdates(false);
      await this.setDeskRoute();
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
      await setupInstance(filePath, setupWizardOptions);
      await this.setDesk();
    },
    async showSetupWizardOrDesk(filePath) {
      const countryCode = await fyo.db.connectToDatabase(filePath);
      const setupComplete = await getSetupComplete();

      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
        return;
      }

      await initializeInstance(filePath, false, countryCode);
      await this.setDesk();
    },
    async setDeskRoute() {
      const { onboardingComplete } = await fyo.doc.getSingle('GetStarted');
      const { hideGetStarted } = await fyo.doc.getSingle('SystemSettings');

      if (hideGetStarted || onboardingComplete) {
        routeTo('/');
      } else {
        routeTo('/get-started');
      }
    },
    async changeDbFile() {
      fyo.config.set('lastSelectedFilePath', null);
      fyo.telemetry.stop();
      fyo.purgeCache();
      this.activeScreen = 'DatabaseSelector';
    },
  },
};
</script>
