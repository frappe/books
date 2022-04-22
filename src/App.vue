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
    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      @file-selected="fileSelected"
    />
    <SetupWizard
      v-if="activeScreen === 'SetupWizard'"
      @setup-complete="setupComplete"
      @setup-canceled="setupCanceled"
    />
    <div
      id="toast-container"
      class="absolute bottom-0 flex flex-col items-end mb-3 pr-6"
      style="width: 100%"
    >
      <div id="toast-target" />
    </div>
    <!-- TODO: check this and uncomment
    <TelemetryModal />-->
  </div>
</template>

<script>
import fs from 'fs/promises';
import WindowsTitleBar from './components/WindowsTitleBar.vue';
import { fyo, initializeInstance } from './initFyo';
import DatabaseSelector from './pages/DatabaseSelector.vue';
import SetupWizard from './pages/SetupWizard/SetupWizard.vue';
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
    // TelemetryModal,
  },
  async mounted() {
    fyo.telemetry.platform = this.platform;
    /*
    const lastSelectedFilePath = fyo.config.get('lastSelectedFilePath', null);
    const { connectionSuccess, reason } = await connectToLocalDatabase(
      lastSelectedFilePath
    );

    if (connectionSuccess) {
      this.showSetupWizardOrDesk(false);
      return;
    }

    if (lastSelectedFilePath) {
      const title = this.t`DB Connection Error`;
      const content = `reason: ${reason}, filePath: ${lastSelectedFilePath}`;

      await showErrorDialog(title, content);
    }
    */

    // this.activeScreen = 'DatabaseSelector';
    this.activeScreen = 'SetupWizard';
  },
  methods: {
    async setupComplete() {
      // TODO: Complete this
      // await postSetup();
      // await this.showSetupWizardOrDesk(true);
    },
    async fileSelected(filePath, isNew) {
      console.log('from App.vue', filePath, isNew);
      if (isNew) {
        this.activeScreen = 'SetupWizard';
        return;
      }

      await this.showSetupWizardOrDesk(filePath);
    },
    async showSetupWizardOrDesk(filePath, resetRoute = false) {
      const countryCode = await fyo.db.connectToDatabase(filePath);
      const setupComplete = await getSetupComplete();

      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
        return;
      }

      await initializeInstance(filePath, false, countryCode);
      this.activeScreen = 'Desk';
      await checkForUpdates(false);
      if (!resetRoute) {
        return;
      }

      await this.setDeskRoute();
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
    async setupCanceled() {
      const filePath = fyo.config.get('lastSelectedFilePath');
      if (filePath) {
        await fs.unlink(filePath);
      }
      this.changeDbFile();
    },
  },
};
</script>
