<template>
  <div
    id="app"
    class="h-screen flex flex-col font-sans overflow-hidden antialiased"
  >
    <!-- <WindowsTitleBar v-if="platform === 'Windows'" />
    <Desk
      class="flex-1"
      v-if="activeScreen === 'Desk'"
      @change-db-file="changeDbFile"
    />-->
    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      @database-connect="showSetupWizardOrDesk(true)"
    />
    <!--<SetupWizard
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
    <TelemetryModal />-->
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import fs from 'fs/promises';
import { IPC_MESSAGES } from 'utils/messages';
import { fyo } from './initFyo';
import DatabaseSelector from './pages/DatabaseSelector';
// import Desk from './pages/Desk';
// import SetupWizard from './pages/SetupWizard/SetupWizard';
import './styles/index.css';
import { checkForUpdates, routeTo } from './utils';

export default {
  name: 'App',
  data() {
    return {
      activeScreen: null,
    };
  },
  watch: {
    async activeScreen(value) {
      if (!value) return;
      const { width, height } = await ipcRenderer.invoke(
        IPC_ACTIONS.GET_PRIMARY_DISPLAY_SIZE
      );

      let size = {
        Desk: [width, height],
        DatabaseSelector: [600, 600],
        SetupWizard: [600, 600],
      }[value];
      let resizable = value === 'Desk';

      if (size.length) {
        ipcRenderer.send(IPC_MESSAGES.RESIZE_MAIN_WINDOW, size, resizable);
      }
    },
  },
  components: {
    // Desk,
    // SetupWizard,
    DatabaseSelector,
    // WindowsTitleBar,
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

    this.activeScreen = 'DatabaseSelector';
  },
  methods: {
    async setupComplete() {
      // TODO: Complete this
      // await postSetup();
      await this.showSetupWizardOrDesk(true);
    },
    async showSetupWizardOrDesk(resetRoute = false) {
      const { setupComplete } = fyo.singles.AccountingSettings;
      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
      } else {
        this.activeScreen = 'Desk';
        await checkForUpdates(false);
      }

      if (!resetRoute) {
        return;
      }

      const { onboardingComplete } = await fyo.getSingle('GetStarted');
      const { hideGetStarted } = await fyo.getSingle('SystemSettings');

      if (hideGetStarted || onboardingComplete) {
        routeTo('/');
      } else {
        routeTo('/get-started');
      }
    },
    async changeDbFile() {
      fyo.config.set('lastSelectedFilePath', null);
      telemetry.stop();
      // TODO: purgeCache(true)
      // await purgeCache(true);
      this.activeScreen = 'DatabaseSelector';
    },
    async setupCanceled() {
      const filePath = fyo.config.get('lastSelectedFilePath');
      await fs.unlink(filePath);
      this.changeDbFile();
    },
  },
};
</script>
