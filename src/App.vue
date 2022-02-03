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
  </div>
</template>

<script>
import './styles/index.css';
import frappe from 'frappe';
import Desk from './pages/Desk';
import SetupWizard from './pages/SetupWizard/SetupWizard';
import DatabaseSelector from './pages/DatabaseSelector';
import WindowsTitleBar from '@/components/WindowsTitleBar';
import { ipcRenderer } from 'electron';
import config from '@/config';
import { IPC_MESSAGES, IPC_ACTIONS } from '@/messages';
import {
  connectToLocalDatabase,
  postSetup,
  purgeCache,
} from '@/initialization';
import { checkForUpdates, routeTo } from './utils';
import fs from 'fs/promises';
import { showErrorDialog } from './errorHandling';

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
  },
  async mounted() {
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
        checkForUpdates(false);
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
    changeDbFile() {
      config.set('lastSelectedFilePath', null);
      purgeCache(true);
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
