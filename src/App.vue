<template>
  <div
    id="app"
    class="h-screen flex flex-col font-sans overflow-hidden antialiased"
  >
    <WindowsTitleBar
      v-if="platform === 'Windows'"
      @close="reloadMainWindowOnSettingsClose"
    />
    <Desk class="flex-1" v-if="activeScreen === 'Desk'" />
    <DatabaseSelector
      v-if="activeScreen === 'DatabaseSelector'"
      @database-connect="showSetupWizardOrDesk(true)"
    />
    <SetupWizard
      v-if="activeScreen === 'SetupWizard'"
      @setup-complete="showSetupWizardOrDesk(true)"
    />
    <Settings v-if="activeScreen === 'Settings'" />
    <portal-target name="popovers" multiple></portal-target>
  </div>
</template>

<script>
import './styles/index.css';
// import 'frappe-charts/dist/frappe-charts.min.css';
import frappe from 'frappejs';
import Desk from './pages/Desk';
import SetupWizard from './pages/SetupWizard/SetupWizard';
import DatabaseSelector from './pages/DatabaseSelector';
import Settings from '@/pages/Settings/Settings.vue';
import WindowsTitleBar from '@/components/WindowsTitleBar';
import { ipcRenderer } from 'electron';
import config from '@/config';
import { connectToLocalDatabase } from '@/utils';
import { IPC_MESSAGES, IPC_ACTIONS } from '@/messages';

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
      const { width, height } = ipcRenderer.invoke(
        IPC_ACTIONS.GET_PRIMARY_DISPLAY_SIZE
      );
      let size = {
        Desk: [width, height],
        DatabaseSelector: [600, 600],
        SetupWizard: [600, 600],
        Settings: [460, 577],
      }[value];
      let resizable = value === 'Desk';

      if (size.length && value != 'Settings') {
        ipcRenderer.send(IPC_MESSAGES.RESIZE_MAIN_WINDOW, size, resizable);
      }
    },
  },
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector,
    Settings,
    WindowsTitleBar,
  },
  async mounted() {
    let lastSelectedFilePath = config.get('lastSelectedFilePath', null);
    if (!lastSelectedFilePath) {
      this.activeScreen = 'DatabaseSelector';
    } else {
      await connectToLocalDatabase(lastSelectedFilePath);
      this.showSetupWizardOrDesk();
    }
  },
  methods: {
    showSetupWizardOrDesk(resetRoute = false) {
      const { setupComplete } = frappe.AccountingSettings;
      if (!setupComplete) {
        this.activeScreen = 'SetupWizard';
      } else if (this.$route.path.startsWith('/settings')) {
        this.activeScreen = 'Settings';
      } else {
        this.activeScreen = 'Desk';
        this.checkForUpdates();
      }
      if (resetRoute) {
        this.$router.replace('/');
      }
    },
    reloadMainWindowOnSettingsClose() {
      if (this.activeScreen === 'Settings') {
        frappe.events.trigger('reload-main-window');
      }
    },
    checkForUpdates() {
      frappe.events.trigger('check-for-updates');
    },
  },
};
</script>
