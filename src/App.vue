<template>
  <div
    id="app"
    class="h-screen flex flex-col font-sans overflow-hidden antialiased"
  >
    <WindowsTitleBar v-if="platform === 'Windows'" />
    <Desk
      class="flex-1"
      v-if="activeScreen === 'Desk'"
      @change-db-file="changeDbFile"
    />
    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      @database-connect="showSetupWizardOrDesk(true)"
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
    <TelemetryModal />
  </div>
</template>

<script>
import WindowsTitleBar from '@/components/WindowsTitleBar';
import config from '@/config';
import {
  connectToLocalDatabase,
  postSetup,
  purgeCache,
} from '@/initialization';
import { IPC_ACTIONS, IPC_MESSAGES } from '@/messages';
import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import fs from 'fs/promises';
import TelemetryModal from './components/once/TelemetryModal.vue';
import { showErrorDialog } from './errorHandling';
import DatabaseSelector from './pages/DatabaseSelector';
import Desk from './pages/Desk';
import SetupWizard from './pages/SetupWizard/SetupWizard';
import './styles/index.css';
import telemetry from './telemetry/telemetry';
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
    Desk,
    SetupWizard,
    DatabaseSelector,
    WindowsTitleBar,
    TelemetryModal,
  },
  async mounted() {
    telemetry.platform = this.platform;
    const lastSelectedFilePath = config.get('lastSelectedFilePath', null);
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

    this.activeScreen = 'DatabaseSelector';
  },
  methods: {
    async setupComplete() {
      await postSetup();
      await this.showSetupWizardOrDesk(true);
    },
    async showSetupWizardOrDesk(resetRoute = false) {
      const { setupComplete } = frappe.AccountingSettings;
      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
      } else {
        this.activeScreen = 'Desk';
        await checkForUpdates(false);
      }

      if (!resetRoute) {
        return;
      }

      const { onboardingComplete } = await frappe.getSingle('GetStarted');
      const { hideGetStarted } = await frappe.getSingle('SystemSettings');

      if (hideGetStarted || onboardingComplete) {
        routeTo('/');
      } else {
        routeTo('/get-started');
      }
    },
    async changeDbFile() {
      config.set('lastSelectedFilePath', null);
      telemetry.stop();
      await purgeCache(true);
      this.activeScreen = 'DatabaseSelector';
    },
    async setupCanceled() {
      const filePath = config.get('lastSelectedFilePath');
      await fs.unlink(filePath);
      this.changeDbFile();
    },
  },
};
</script>
